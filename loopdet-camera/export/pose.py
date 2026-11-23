"""Export the four-step LoopPose-S webcam profiles."""

import argparse
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

import onnx
import torch


SIZES = (640, 512)


def load_pose(repo, weights, size):
    if size not in SIZES or not (repo / 'loopdvr/build.py').is_file():
        raise ValueError('Expected a LoopDVR release checkout and a 512- or 640-pixel pose profile')
    sys.path.insert(0, str(repo.resolve()))
    from loopdvr.build import LoopDVR, build_model, load_config

    config = load_config(repo / 'configs/looppose/looppose-s.yaml')
    decoder = config['decoder']
    if (config['task'], decoder['num_queries'], decoder['num_body_points'], decoder['num_classes'],
        decoder['group_sizes']) != ('pose', 60, 17, 2, [2, 2]):
        raise ValueError('Expected the released LoopPose-S decoder configuration')
    model = build_model(config, weights)
    if config['input_size'] != [size, size]:
        state = model.state_dict()
        config['input_size'] = [size, size]
        model = LoopDVR(config).eval()
        # The constructor generates the anchor grids, masks and encoder positions at this resolution.
        state['decoder.anchors'] = model.decoder.anchors
        state['decoder.valid_mask'] = model.decoder.valid_mask
        model.load_state_dict(state, strict=True)
    if size == 512:
        # Encoder proposals arrive in descending score order. Preserve the learned
        # embedding of each retained rank when taking the first 24 proposals.
        decoder = model.decoder
        decoder.num_queries = 24
        decoder.tgt_embed = torch.nn.Embedding.from_pretrained(
            decoder.tgt_embed.weight[:decoder.num_queries].detach().clone(), freeze=True,
        )
    return model


class PoseExport(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        from loopdvr.models.postprocess import postprocess

        self.model = model
        self.num_queries = model.decoder.num_queries
        self.postprocess = postprocess
        self.register_buffer('unit_wh', torch.ones(1, 2))

    def forward(self, images):
        result = self.postprocess(self.model(images), self.unit_wh, 'pose')[0]
        # The official top-k combines both class slots. Only COCO category 1 is a person.
        # Keep that exact candidate set and return zero-score padding at the end.
        people = result['scores'].masked_fill(result['labels'] != 1, 0.)
        scores, order = people.sort(descending=True)
        points = result['keypoints'].reshape(self.num_queries, 17, 3)[..., :2].index_select(0, order)
        bounds = torch.cat((points.amin(dim=1), points.amax(dim=1)), dim=-1)
        return bounds, scores, torch.zeros_like(scores, dtype=torch.int32), points


def trace_pose(repo, weights, size, path):
    model = PoseExport(load_pose(repo, weights, size)).eval()
    torch.set_num_threads(2)
    torch.backends.mha.set_fastpath_enabled(False)
    with torch.inference_mode():
        for module in list(model.modules()):
            if hasattr(module, 'convert_to_deploy'):
                module.convert_to_deploy()
        torch.onnx.export(model, torch.zeros(1, 3, size, size), path, dynamo=False,
                          input_names=['images'], output_names=['boxes', 'scores', 'labels', 'keypoints'],
                          do_constant_folding=True, opset_version=18)


def main():
    from export import fold_constants, save_fp16
    from pose_fusions import optimize_pose_graph

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True, help='LoopDVR release checkout')
    parser.add_argument('--weights', type=Path, required=True, help='Released looppose-s.pth checkpoint')
    parser.add_argument('--output', type=Path, required=True, help='Destination for webcam ONNX files')
    parser.add_argument('--size', type=int, choices=SIZES, help='Export one resolution (default: both)')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=args.output) as temp:
        temp = Path(temp)
        artifacts = []
        for size in (args.size,) if args.size else SIZES:
            raw = temp / 'traced.onnx'
            fp32 = temp / f'looppose-s-{size}-fp32.onnx'
            fp16 = temp / f'looppose-s-{size}-fp16.onnx'
            trace_pose(args.repo, args.weights, size, raw)
            model = optimize_pose_graph(onnx.load(raw), size)
            save_fp16(fold_constants(model, fp32), fp16)
            artifacts.extend((fp32, fp16))
        for artifact in artifacts:
            destination = artifact.replace(args.output / artifact.name)
            print(f'{destination} ({destination.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
