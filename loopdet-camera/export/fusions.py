"""Fuse fixed-shape LoopDVR graphs for ONNX Runtime WebGPU."""

from copy import deepcopy
import math
import re

import numpy as np
import onnx
import onnxruntime as ort
from onnx import TensorProto, helper, numpy_helper


DOMAIN = 'com.microsoft'
BACKBONE_ATTENTION = re.compile(r'/model/looped_vit/blocks\.\d+/attn(?:_\d+)?/Softmax')


def require(condition, detail):
    if not condition:
        raise ValueError(f'Unsupported LoopDVR graph: {detail}')


def prune(graph):
    live = {tensor.name for tensor in graph.output}
    retained = []
    for node in reversed(graph.node):
        if not live.isdisjoint(node.output):
            retained.append(node)
            live.update(node.input)
    initializers = [tensor for tensor in graph.initializer if tensor.name in live]
    del graph.node[:]
    graph.node.extend(reversed(retained))
    del graph.initializer[:]
    graph.initializer.extend(initializers)
    del graph.value_info[:]


def rotary_tables(model, names, size):
    # The release computes these constants from the image grid and its RoPE periods.
    # Evaluate only that subgraph so its float32 rounding matches the traced model.
    constant_model = deepcopy(model)
    graph = constant_model.graph
    del graph.output[:]
    graph.output.extend(helper.make_tensor_value_info(name, TensorProto.FLOAT, None) for name in names)
    prune(graph)
    graph.ClearField('input')
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    session = ort.InferenceSession(constant_model.SerializeToString(), options, providers=['CPUExecutionProvider'])
    cosine, sine = [values.reshape(-1, values.shape[-1]) for values in session.run(None, {})]
    side = size // 16
    require(cosine.shape == sine.shape == (side * side, 64),
            f'expected {side} × {side} patches and 64 rotary dimensions')
    for table in (cosine, sine):
        require(np.array_equal(table[:, :32], table[:, 32:]), 'expected split-half rotary embedding')
    # Identity rotation leaves the leading register token unchanged.
    return {
        'loop.rope.cos': np.vstack([np.ones((1, 32), dtype=cosine.dtype), cosine[:, :32]]),
        'loop.rope.sin': np.vstack([np.zeros((1, 32), dtype=sine.dtype), sine[:, :32]]),
        'loop.rope.positions': np.arange(side * side + 1, dtype=np.int64)[None, :],
    }


def fuse_rotary(model, nodes, roots, replacements, size):
    cosine = nodes[roots[0] + '/Mul'].input[1]
    sine = nodes[roots[0] + '/Mul_1'].input[1]
    tables = rotary_tables(model, [cosine, sine], size)
    model.graph.initializer.extend(numpy_helper.from_array(array, name) for name, array in tables.items())
    for root in roots:
        paths = [('Concat_1', 'Transpose', 'Mul', 'Mul_1'), ('Concat_3', 'Transpose_1', 'Mul_2', 'Mul_3')]
        for target, source, cos_path, sin_path in paths:
            require(nodes[f'{root}/{cos_path}'].input[1] == cosine and
                    nodes[f'{root}/{sin_path}'].input[1] == sine, f'inconsistent rotary tables at {root}')
            end = nodes[f'{root}/{target}']
            source_value = nodes[f'{root}/{source}'].output[0]
            replacements[end.name] = [helper.make_node(
                'RotaryEmbedding', [source_value, 'loop.rope.positions', 'loop.rope.cos', 'loop.rope.sin'],
                list(end.output), name=f'{root}/Rotary{target}', domain=DOMAIN, interleaved=0,
            )]


def fuse_gelu(nodes, replacements, expected_count=28):
    erfs = [node for node in nodes.values() if node.op_type == 'Erf']
    require(len(erfs) == expected_count, f'expected {expected_count} GELU activations')
    for erf in erfs:
        root = erf.name.rsplit('/', 1)[0]
        div, add, mul, end = [nodes[f'{root}/{name}'] for name in ('Div', 'Add', 'Mul', 'Mul_1')]
        constants = [nodes[f'{root}/{name}'] for name in ('Constant', 'Constant_1', 'Constant_2')]
        x = div.input[0]
        require(list(div.input) == [x, constants[0].output[0]] and erf.input[0] == div.output[0] and
                list(add.input) == [erf.output[0], constants[1].output[0]] and
                list(mul.input) == [x, add.output[0]] and list(end.input) == [mul.output[0], constants[2].output[0]],
                f'expected 0.5 * x * (1 + erf(x / sqrt(2))) at {root}')
        scalars = [numpy_helper.to_array(node.attribute[0].t).item() for node in constants]
        require(np.allclose(scalars, [math.sqrt(2), 1, .5]), f'unexpected GELU constants at {root}')
        replacements[end.name] = [helper.make_node('Gelu', [x], list(end.output), name=f'{root}/ExactGelu', domain=DOMAIN)]


def fuse_box_refinement(model, nodes, replacements):
    decoder = '/model/decoder/'
    reference = nodes[decoder + 'Sigmoid_1'].output[0]
    scale_name = nodes[decoder + 'Abs_2'].input[0]
    weights = {tensor.name: tensor for tensor in model.graph.initializer}
    scale = abs(numpy_helper.to_array(weights[scale_name]).item())
    require(np.isfinite(scale) and scale > 0, 'invalid decoder regression scale')
    # Turn four (left, top, right, bottom) distances into a single (cx, cy, w, h) delta.
    deltas = np.array([[-.5, 0, 1, 0], [0, -.5, 0, 1], [.5, 0, 1, 0], [0, .5, 0, 1]], dtype=np.float32) / scale
    corners = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [-.5, 0, .5, 0], [0, -.5, 0, .5]], dtype=np.float32)
    constants = {'ref.wh.indices': np.array([2, 3, 2, 3], dtype=np.int64), 'ref.decode': deltas, 'ref.xyxy': corners}
    model.graph.initializer.extend(numpy_helper.from_array(value, name) for name, value in constants.items())
    for stage in range(4):
        root = f'ref.decode.{stage}'
        split = nodes[decoder + ('Split' if stage == 0 else f'Split_{stage}')]
        end = nodes[decoder + f'Concat_{9 + 2 * stage}']
        require(split.input[0] == reference and len(split.output) == len(end.input) == 4,
                f'unexpected reference box at stage {stage}')
        distances = nodes[decoder + f'Reshape_{7 + 2 * stage}'].output[0]
        seq = []
        if stage == 0:
            seq.append(helper.make_node('Gather', [reference, 'ref.wh.indices'], ['ref.whwh'], axis=-1))
        seq.extend([
            helper.make_node('MatMul', [distances, 'ref.decode'], [root + '.delta']),
            helper.make_node('Mul', [root + '.delta', 'ref.whwh'], [root + '.scaled']),
            helper.make_node('Add', [root + '.scaled', reference], list(end.output)),
        ])
        replacements[end.name] = seq
    end = nodes['/Concat']
    replacements[end.name] = [helper.make_node('MatMul', [nodes['/Split'].input[0], 'ref.xyxy'], list(end.output))]


def fuse_backbone_attention(nodes, roots, replacements):
    for root in roots:
        def out(name):
            return nodes[f'{root}/{name}'].output[0]

        require(list(nodes[root + '/MatMul'].input) == [out('Mul_4'), out('Mul_5')] and
                nodes[root + '/Softmax'].input[0] == out('MatMul') and
                nodes[root + '/Mul_4'].input[0] == out('Concat_1') and
                nodes[root + '/Transpose_3'].input[0] == out('Concat_3') and
                nodes[root + '/Transpose_2'].input[0] == out('Squeeze_2') and
                list(nodes[root + '/MatMul_1'].input) == [out('Softmax'), out('Transpose_2')],
                f'expected unmasked scaled dot-product attention at {root}')
        end = nodes[root + '/Reshape_1']
        require(end.input[0] == out('Transpose_4'), f'expected attention output reshape at {root}')
        seq, inputs = [], []
        for label, name in [('Q', 'Concat_1'), ('K', 'Concat_3'), ('V', 'Squeeze_2')]:
            value = out(name)
            if label != 'V':
                transposed = f'{root}/{label}BSNH'
                seq.append(helper.make_node('Transpose', [value], [transposed], perm=[0, 2, 1, 3], name=transposed))
                value = transposed
            flat = f'{root}/{label}BSD'
            seq.append(helper.make_node('Reshape', [value, end.input[1]], [flat], name=flat))
            inputs.append(flat)
        seq.append(helper.make_node('MultiHeadAttention', inputs, list(end.output), domain=DOMAIN,
                                    num_heads=3, name=root + '/MultiHeadAttention'))
        replacements[end.name] = seq


def fuse_head_attention(nodes, replacements):
    producers = {value: node for node in nodes.values() for value in node.output}
    roots = [name.rsplit('/', 1)[0] for name in nodes if re.search(r'/self_attn(?:_\d+)?/Softmax$', name)]
    require(len(roots) == 5 and sum('/encoder/' in name for name in roots) == 1 and
            sum('/decoder/' in name for name in roots) == 4, 'expected one encoder and four decoder self-attention layers')
    for root in roots:
        def node(name):
            return nodes[f'{root}/{name}']

        end = node('Reshape_3')
        scale = producers[node('Mul_1').input[1]]
        require(node('Softmax').input[0] == node('MatMul_3').output[0] and node('Softmax').attribute[0].i == -1 and
                node('MatMul_3').input[0] == node('Mul_1').output[0] and node('MatMul_4').input[0] == node('Softmax').output[0] and
                node('Gemm').input[0] == end.output[0] and scale.op_type == 'Constant' and
                np.isclose(numpy_helper.to_array(scale.attribute[0].t).item(), 1 / math.sqrt(24)),
                f'expected eight-head unmasked attention at {root}')
        seq, inputs = [], []
        for label, add in [('Q', 'Add'), ('K', 'Add_1'), ('V', 'Add_2')]:
            value = f'{root}/{label}BSD'
            seq.append(helper.make_node('Transpose', [node(add).output[0]], [value], perm=[1, 0, 2], name=value))
            inputs.append(value)
        output = root + '/AttentionBSD'
        seq.append(helper.make_node('MultiHeadAttention', inputs, [output], domain=DOMAIN,
                                    num_heads=8, name=root + '/MultiHeadAttention'))
        seq.append(helper.make_node('Flatten', [output], list(end.output), axis=2, name=root + '/FlattenBatchOne'))
        replacements[end.name] = seq


def optimize_graph(model: onnx.ModelProto, size: int) -> onnx.ModelProto:
    """Fuse all twelve backbone steps of the 100-query detector with four decoder updates."""
    require(size in (512, 640), 'expected a square input of 512 or 640 pixels')
    graph = model.graph
    signature = [(value.name, value.type.tensor_type.elem_type, [d.dim_value for d in value.type.tensor_type.shape.dim])
                 for value in [*graph.input, *graph.output]]
    require(signature == [('images', TensorProto.FLOAT, [1, 3, size, size]), ('boxes', TensorProto.FLOAT, [100, 4]),
                          ('scores', TensorProto.FLOAT, [100]), ('labels', TensorProto.INT32, [100])],
            'expected a single image at the requested resolution and 100 output queries')
    require([(s.domain, s.version) for s in model.opset_import] == [('', 18)], 'expected standard ONNX opset 18')
    nodes = {node.name: node for node in graph.node}
    roots = [name.rsplit('/', 1)[0] for name in nodes if BACKBONE_ATTENTION.fullmatch(name)]
    require(len(roots) == 12, 'expected twelve backbone attention blocks')
    replacements = {}
    try:
        fuse_rotary(model, nodes, roots, replacements, size)
        fuse_gelu(nodes, replacements)
        fuse_box_refinement(model, nodes, replacements)
        fuse_backbone_attention(nodes, roots, replacements)
        fuse_head_attention(nodes, replacements)
    except (KeyError, IndexError) as error:
        raise ValueError(f'Incompatible LoopDet-S exporter topology: {error}') from error
    rewritten = [updated for node in graph.node for updated in replacements.get(node.name, [node])]
    del graph.node[:]
    graph.node.extend(rewritten)
    model.opset_import.append(helper.make_opsetid(DOMAIN, 1))
    prune(graph)
    onnx.checker.check_model(model)
    return model
