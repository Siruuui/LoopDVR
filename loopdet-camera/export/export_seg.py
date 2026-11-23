"""Export the 512- and 640-pixel LoopSeg-S webcam profiles with the complete four-step decoder."""

import argparse
from pathlib import Path
import sys
from tempfile import TemporaryDirectory


# The encoder proposal top-k and the final top-k over query/class scores share this count.
QUERIES_BY_SIZE = {512: 100, 640: 300}


def prepare(repo, weights, size):
    import torch
    from torchvision.ops import box_convert

    sys.path.insert(0, str(repo.resolve()))
    from loopdvr.build import LoopDVR, build_model, load_config

    query_count = QUERIES_BY_SIZE[size]
    config = load_config(repo / 'configs/loopseg/loopseg-s.yaml')
    decoder = config['decoder']
    if (config['task'] != 'seg' or decoder['num_queries'] != 300 or decoder['num_classes'] != 80
            or decoder['mask_downsample_ratio'] != 4):
        raise ValueError('Expected the published 300-query LoopSeg-S with stride-four masks')
    model = build_model(config, weights)
    if config['input_size'] != [size, size]:
        state = model.state_dict()
        config['input_size'] = [size, size]
        model = LoopDVR(config).eval()
        # Rebuild the resolution-dependent grids while preserving every trained parameter.
        state['decoder.anchors'] = model.decoder.anchors
        state['decoder.valid_mask'] = model.decoder.valid_mask
        model.load_state_dict(state, strict=True)
    # This sets the encoder proposal top-k; LoopSeg has no learned per-query embedding.
    model.decoder.num_queries = query_count
    if tuple(model.decoder.decoder.layer_to_group) != (0, 0, 1, 1):
        raise ValueError('Expected all four released decoder updates')

    class SegmentationExport(torch.nn.Module):
        def __init__(self, trained):
            super().__init__()
            self.model = trained

        def forward(self, images):
            raw = self.model(images)
            probabilities = raw['pred_logits'][0].sigmoid()
            # The release ranks all query/class pairs, allowing one query to appear under multiple labels.
            scores, index = probabilities.flatten().topk(query_count)
            queries = index // 80
            labels = (index % 80).to(torch.int32)
            boxes = box_convert(raw['pred_boxes'][0], in_fmt='cxcywh', out_fmt='xyxy')
            return boxes.index_select(0, queries), scores, labels, raw['pred_masks'][0].index_select(0, queries)

    return SegmentationExport(model).eval(), config


def trace(model, size, path):
    import torch

    torch.set_num_threads(2)
    torch.backends.mha.set_fastpath_enabled(False)
    with torch.inference_mode():
        for module in list(model.modules()):
            if hasattr(module, 'convert_to_deploy'):
                module.convert_to_deploy()
        torch.onnx.export(
            model, torch.zeros(1, 3, size, size), path,
            input_names=['images'], output_names=['boxes', 'scores', 'labels', 'masks'],
            opset_version=18, do_constant_folding=True, dynamo=False,
        )


def fuse_mask_head(graph, replacements, side, query_count):
    """Express the published mask contraction as a batched matrix multiplication."""
    import numpy as np
    from onnx import helper, numpy_helper

    contractions = [node for node in graph.node if node.op_type == 'Einsum']
    if len(contractions) != 1 or contractions[0].attribute[0].s != b'bchw,bnc->bnhw':
        raise ValueError('Unexpected segmentation head contraction')
    contraction = contractions[0]
    constants = [('seg.spatialShape', [1, 192, side * side]), ('seg.maskShape', [1, query_count, side, side])]
    graph.initializer.extend(numpy_helper.from_array(np.array(shape, np.int64), name) for name, shape in constants)
    replacements[contraction.name] = [
        helper.make_node('Reshape', [contraction.input[0], 'seg.spatialShape'], ['seg.spatial'], name='FlattenMaskFeatures'),
        helper.make_node('MatMul', [contraction.input[1], 'seg.spatial'], ['seg.flatLogits'], name='MaskQueryDotProduct'),
        helper.make_node('Reshape', ['seg.flatLogits', 'seg.maskShape'], list(contraction.output), name='RestoreMaskGrid'),
    ]


def optimize(raw, size):
    import onnx
    from onnx import helper, TensorProto
    from fusions import BACKBONE_ATTENTION, DOMAIN, fuse_backbone_attention, fuse_rotary, prune

    graph = raw.graph
    signature = [
        (value.name, value.type.tensor_type.elem_type,
         [dimension.dim_value for dimension in value.type.tensor_type.shape.dim])
        for value in [*graph.input, *graph.output]
    ]
    side = size // 4
    query_count = QUERIES_BY_SIZE[size]
    expected = [
        ('images', TensorProto.FLOAT, [1, 3, size, size]),
        ('boxes', TensorProto.FLOAT, [query_count, 4]),
        ('scores', TensorProto.FLOAT, [query_count]),
        ('labels', TensorProto.INT32, [query_count]),
        ('masks', TensorProto.FLOAT, [query_count, side, side]),
    ]
    if signature != expected:
        raise ValueError(f'Unexpected LoopSeg export interface {signature}')
    nodes = {node.name: node for node in graph.node}
    roots = [name.rsplit('/', 1)[0] for name in nodes if BACKBONE_ATTENTION.fullmatch(name)]
    if len(roots) != 12:
        raise ValueError('Expected twelve original backbone iterations')
    replacements = {}
    fuse_rotary(raw, nodes, roots, replacements, size)
    fuse_backbone_attention(nodes, roots, replacements)
    fuse_mask_head(graph, replacements, side, query_count)

    rewritten = [updated for node in graph.node for updated in replacements.get(node.name, [node])]
    del graph.node[:]
    graph.node.extend(rewritten)
    raw.opset_import.append(helper.make_opsetid(DOMAIN, 1))
    prune(graph)
    onnx.checker.check_model(raw)
    return raw


def convert(source, size, output):
    import onnx
    from export import fold_constants, save_fp16

    output.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=output) as scratch:
        fp32 = Path(scratch) / f'loopseg-s-{size}-fp32.onnx'
        fp16 = Path(scratch) / f'loopseg-s-{size}-fp16.onnx'
        folded = fold_constants(optimize(onnx.load(source), size), fp32)
        save_fp16(folded, fp16)
        for artifact in (fp32, fp16):
            artifact.replace(output / artifact.name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True, help='LoopDVR release checkout')
    parser.add_argument('--weights', type=Path, required=True, help='Released loopseg-s.pth checkpoint')
    parser.add_argument('--output', type=Path, required=True, help='Directory for the ONNX files')
    parser.add_argument('--size', choices=tuple(QUERIES_BY_SIZE), type=int, help='Export one resolution (default: both)')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for size in ((args.size,) if args.size else QUERIES_BY_SIZE):
        with TemporaryDirectory(dir=args.output) as temp:
            raw = Path(temp) / 'raw.onnx'
            model, _ = prepare(args.repo, args.weights, size)
            trace(model, size, raw)
            convert(raw, size, args.output)


if __name__ == '__main__':
    main()
