"""Fuse the fixed-shape LoopPose-S backbone and unmasked self-attention for WebGPU."""

import math
import re

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper

from fusions import BACKBONE_ATTENTION, DOMAIN, fuse_backbone_attention, fuse_gelu, fuse_rotary, prune


def require(condition, detail):
    if not condition:
        raise ValueError(f'Unsupported LoopPose-S graph: {detail}')


def permutation(node):
    return list(helper.get_attribute_value(next(a for a in node.attribute if a.name == 'perm')))


def sequence_major_projection(value, spec, producers):
    """Find the Q, K or V projection before PyTorch separates the eight attention heads."""
    axes = [0, 1, 2]
    node = producers[value]
    while node.op_type == 'Transpose':
        perm = permutation(node)
        axes = [perm[axis] for axis in axes]
        node = producers[node.input[0]]
    require(node.op_type == 'Reshape' and axes == spec, f'head layout at {value}')
    return node.input[0]


def only_consumer(consumers, value, kind):
    matches = [node for node in consumers[value] if node.op_type == kind]
    require(len(matches) == 1, f'expected a {kind} consuming {value}')
    return matches[0]


def fuse_pose_attention(nodes, replacements):
    producers = {value: node for node in nodes.values() for value in node.output}
    consumers = {}
    for node in nodes.values():
        for value in node.input:
            consumers.setdefault(value, []).append(node)
    attention = [node for node in nodes.values() if node.op_type == 'Softmax' and
                 re.search(r'/(?:self_attn|within_attn|across_attn)(?:_\d+)?/Softmax$', node.name)]
    require(sum('/encoder/' in node.name for node in attention) == 1 and
            sum('/within_attn' in node.name for node in attention) == 4 and
            sum('/across_attn' in node.name for node in attention) == 4 and len(attention) == 9,
            'expected an encoder and four within-person and four across-person attention calls')
    for softmax in attention:
        root = softmax.name.rsplit('/', 1)[0]
        logits = producers[softmax.input[0]]
        require(softmax.attribute[0].i == -1 and logits.op_type == 'MatMul', f'unmasked attention at {root}')
        scale = producers[logits.input[0]]
        constant = producers[scale.input[1]]
        require(scale.op_type == 'Mul' and constant.op_type == 'Constant' and
                np.isclose(numpy_helper.to_array(constant.attribute[0].t).item(), 1 / math.sqrt(24)),
                f'expected eight 24-dimensional heads at {root}')
        weighted = only_consumer(consumers, softmax.output[0], 'MatMul')
        require(weighted.input[0] == softmax.output[0], f'weighted values at {root}')
        q = sequence_major_projection(scale.input[0], [1, 0, 2], producers)
        k = sequence_major_projection(logits.input[1], [1, 2, 0], producers)
        v = sequence_major_projection(weighted.input[1], [1, 0, 2], producers)
        transposed = only_consumer(consumers, weighted.output[0], 'Transpose')
        require(permutation(transposed) == [1, 0, 2], f'output head layout at {root}')
        end = only_consumer(consumers, transposed.output[0], 'Reshape')
        only_consumer(consumers, end.output[0], 'Gemm')
        seq, inputs = [], []
        for key, value in zip(('Q', 'K', 'V'), (q, k, v)):
            batched = f'{root}/{key}BSD'
            seq.append(helper.make_node('Transpose', [value], [batched], perm=[1, 0, 2], name=batched))
            inputs.append(batched)
        attn, seq_major = root + '/AttentionBSD', root + '/AttentionSBD'
        seq.append(helper.make_node('MultiHeadAttention', inputs, [attn], domain=DOMAIN,
                                    num_heads=8, name=root + '/MultiHeadAttention'))
        # Within-person attention batches the ranked people. Across-person attention batches
        # the 18 instance/joint tokens. The output projection expects sequence-major rows.
        seq.append(helper.make_node('Transpose', [attn], [seq_major], perm=[1, 0, 2], name=seq_major))
        seq.append(helper.make_node('Flatten', [seq_major], list(end.output), axis=2, name=root + '/Flatten'))
        replacements[end.name] = seq


def optimize_pose_graph(model: onnx.ModelProto, size: int) -> onnx.ModelProto:
    """Optimize the released, four-update LoopPose-S graph in place."""
    require(size in (512, 640, 704), 'expected a 512-, 640- or 704-pixel input')
    graph = model.graph
    require(len(graph.input) == 1 and graph.input[0].name == 'images' and
            graph.input[0].type.tensor_type.elem_type == TensorProto.FLOAT and
            [d.dim_value for d in graph.input[0].type.tensor_type.shape.dim] == [1, 3, size, size],
            'expected one NCHW RGB image at the selected resolution')
    outputs = [(value.name, value.type.tensor_type.elem_type,
                [dim.dim_value for dim in value.type.tensor_type.shape.dim]) for value in graph.output]
    queries = 24 if size == 512 else 60
    require(outputs == [('boxes', TensorProto.FLOAT, [queries, 4]), ('scores', TensorProto.FLOAT, [queries]),
                        ('labels', TensorProto.INT32, [queries]), ('keypoints', TensorProto.FLOAT, [queries, 17, 2])],
            'expected the selected profile’s pose query count and 17 xy keypoint pairs')
    require([(s.domain, s.version) for s in model.opset_import] == [('', 18)], 'expected standard ONNX opset 18')
    nodes = {node.name: node for node in graph.node}
    roots = [name.rsplit('/', 1)[0] for name in nodes if BACKBONE_ATTENTION.fullmatch(name)]
    require(len(roots) == 12, 'expected all twelve backbone updates')
    replacements = {}
    try:
        fuse_rotary(model, nodes, roots, replacements, size)
        fuse_gelu(nodes, replacements, expected_count=28)
        fuse_backbone_attention(nodes, roots, replacements)
        fuse_pose_attention(nodes, replacements)
    except (KeyError, IndexError, StopIteration) as error:
        raise ValueError(f'Incompatible LoopPose-S ONNX topology: {error}') from error
    rewritten = [updated for node in graph.node for updated in replacements.get(node.name, [node])]
    del graph.node[:]
    graph.node.extend(rewritten)
    model.opset_import.append(helper.make_opsetid(DOMAIN, 1))
    prune(graph)
    onnx.checker.check_model(model)
    return model
