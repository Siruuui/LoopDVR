"""Export the 640- and 512-pixel LoopDet-S WebGPU webcam profiles."""

import argparse
from collections import Counter
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

import onnx
import onnxruntime as ort
from onnxruntime.transformers.float16 import convert_float_to_float16
from onnxruntime.transformers.onnx_model import OnnxModel
import torch

from fusions import optimize_graph


SIZES = (640, 512)


def trace_release(repo, weights, size, destination):
    if not (repo / 'loopdvr/build.py').is_file():
        raise ValueError(f'Expected a LoopDVR code checkout at {repo}')
    sys.path.insert(0, str(repo.resolve()))
    from loopdvr.build import LoopDVR, build_model, load_config
    from loopdvr.models.postprocess import postprocess

    config = load_config(repo / 'configs/loopdet/loopdet-s.yaml')
    if config['task'] != 'det' or config['decoder']['num_queries'] != 300:
        raise ValueError('The webcam export requires the published LoopDet-S detection config with 300 queries')
    detector = build_model(config, weights)
    if config['input_size'] != [size, size]:
        state = detector.state_dict()
        config['input_size'] = [size, size]
        detector = LoopDVR(config).eval()
        # Keep the grids constructed for this input; copy every learned parameter from the release.
        state['decoder.anchors'] = detector.decoder.anchors
        state['decoder.valid_mask'] = detector.decoder.valid_mask
        detector.load_state_dict(state, strict=True)
    decoder = detector.decoder
    route = tuple(decoder.decoder.layer_to_group)
    if route != (0, 0, 1, 1):
        raise ValueError('Expected two groups of two supervised decoder refinements')
    decoder.num_queries = 100
    # The release forward selects box, score and quality predictions for this exit's group.
    decoder.decoder.layer_to_group = route[:2]

    class DetectionExport(torch.nn.Module):
        def __init__(self, model):
            super().__init__()
            self.model = model
            self.register_buffer('wh', torch.ones(1, 2))

        def forward(self, images):
            result = postprocess(self.model(images), self.wh, 'det')[0]
            return result['boxes'], result['scores'], result['labels'].to(torch.int32)

    model = DetectionExport(detector).eval()
    torch.set_num_threads(2)
    torch.backends.mha.set_fastpath_enabled(False)
    with torch.inference_mode():
        for module in list(model.modules()):
            if hasattr(module, 'convert_to_deploy'):
                module.convert_to_deploy()
        torch.onnx.export(
            model, torch.zeros(1, 3, size, size), destination,
            input_names=['images'], output_names=['boxes', 'scores', 'labels'],
            do_constant_folding=True, dynamo=False, opset_version=18,
        )


def microsoft_ops(model):
    return Counter(node.op_type for node in model.graph.node if node.domain == 'com.microsoft')


def fold_constants(model, destination):
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
    options.optimized_model_filepath = str(destination)
    # Keep WebGPU layout and operator selection separate from CPU constant folding.
    disabled = ['MatMulAddFusion', 'ReshapeFusion', 'MatmulTransposeFusion', 'GemmActivationFusion',
                'QDQPropagationTransformer', 'TransposeOptimizer']
    ort.InferenceSession(model.SerializeToString(), options, providers=['CPUExecutionProvider'],
                         disabled_optimizers=disabled)
    folded = onnx.load(destination)
    if microsoft_ops(folded) != microsoft_ops(model):
        raise ValueError('Constant folding changed the fused WebGPU operators')
    onnx.checker.check_model(folded, full_check=True)
    return folded


def save_fp16(folded, destination):
    reduced = convert_float_to_float16(folded, keep_io_types=True)
    OnnxModel(reduced).topological_sort()
    used_domains = {node.domain for node in reduced.graph.node}
    imports = [version for version in reduced.opset_import if version.domain in used_domains]
    del reduced.opset_import[:]
    reduced.opset_import.extend(imports)
    onnx.checker.check_model(reduced, full_check=True)
    onnx.save(reduced, destination)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True, help='LoopDVR release checkout')
    parser.add_argument('--weights', type=Path, required=True, help='Released loopdet-s.pth checkpoint')
    parser.add_argument('--output', type=Path, required=True, help='Destination for the webcam ONNX files')
    parser.add_argument('--size', type=int, choices=SIZES, help='Export one profile (default: both)')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=args.output) as temp:
        temp = Path(temp)
        artifacts = []
        for size in (args.size,) if args.size else SIZES:
            traced = temp / 'traced.onnx'
            fp32 = temp / f'loopdet-s-{size}-fp32.onnx'
            fp16 = temp / f'loopdet-s-{size}-fp16.onnx'
            trace_release(args.repo, args.weights, size, traced)
            graph = optimize_graph(onnx.load(traced), size)
            folded = fold_constants(graph, fp32)
            save_fp16(folded, fp16)
            artifacts.extend((fp32, fp16))
        for artifact in artifacts:
            destination = artifact.replace(args.output / artifact.name)
            print(f'{destination} ({destination.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
