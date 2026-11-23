# Export the webcam models

All three tasks use their released S checkpoint, run all 12 backbone steps and consume square, ImageNet-normalized RGB. The page defaults to 512 × 512 and a confidence threshold of 0.50. The 640 × 640 option uses the release input size. Both sizes are exported as fixed graphs with their own position and anchor grids.

| Task | Encoder proposals | Decoder route | Outputs |
|---|---:|---|---|
| LoopDet-S | 100 | G0 → G0 | Normalized xyxy boxes, scores, contiguous COCO class indices |
| LoopPose-S | 24 at 512, 60 at 640 | G0 → G0 → G1 → G1 | Person scores and 17 normalized COCO keypoints per person |
| LoopSeg-S | 100 at 512, 300 at 640 | G0 → G0 → G1 → G1 | Normalized boxes, scores, classes and per-instance mask logits |

G0 and G1 denote two distinct trained decoder blocks within each task. Each step also uses its own adapter. The detection webcam model exits after G0's second application, using that group's classification and localization-quality heads and the current refined boxes. The full detection release uses 300 queries and four steps.

At 512, the pose graph takes the top 24 encoder proposals together with the corresponding 24 learned rank embeddings. At 640, it takes the full 60. Both sizes use the release query/class ranking rule, filter to the COCO person category, sort by person score and pad unused rows with zero scores. The 17 keypoints are in COCO order. Their bounding rectangle anchors the on-screen label. The model supplies one score per person.

The segmentation graph ranks all query/class pairs as in the release. At 512 it decodes the top 100 encoder proposals, at 640 the full 300. Its output mask planes follow the same ordering as the boxes and scores. Each mask is a float32 logit grid at one-quarter the input width and height. The browser samples it bilinearly at video pixel centers with boundary replication, then applies the release threshold of zero. Detection boxes, segmentation boxes and mask fills share the same color for a given COCO category across instances and frames. The confidence slider controls the instance score. Where masks overlap, the renderer gives the smaller visible bounding box priority, with score as a tiebreaker. This keeps nested instances visible, such as a cat sitting on a chair.

## Rebuild

Use Python 3.11 and the [LoopDVR release checkout](https://github.com/Siruuui/LoopDVR/tree/16cb569312cd3bbc2ec827f7ca4a0111fa453553). Place the checkpoints under its `weights/` directory.

| Checkpoint | SHA-256 |
|---|---|
| loopdet-s.pth | `67b11c0d6b20096362b6f3e6930bd9748a4083cc3e4affa93c8689bf29c3d307` |
| looppose-s.pth | `a045678a5a2d10e32673270dad520c32ae4c5ca08503a71de3775157b7b71eaa` |
| loopseg-s.pth | `ac0a418dd78d055ad7b9c1b4fc7c08d49b514380058675de3b9f733042714f3d` |

From this exporter directory, set `LOOPDVR_REPO` to the code checkout. Each CPU conversion writes the ONNX files next to the camera page.

```sh
python3.11 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python export.py --repo "$LOOPDVR_REPO" --weights "$LOOPDVR_REPO/weights/loopdet-s.pth" --output ..
python pose.py --repo "$LOOPDVR_REPO" --weights "$LOOPDVR_REPO/weights/looppose-s.pth" --output ..
python export_seg.py --repo "$LOOPDVR_REPO" --weights "$LOOPDVR_REPO/weights/loopseg-s.pth" --output ..
```

Pass `--size 512` or `--size 640` to build a single resolution. At runtime the page loads only the selected task and resolution, choosing FP16 when the WebGPU adapter exposes `shader-f16` and FP32 otherwise. All graphs accept a float32 `images` tensor of shape `[1, 3, size, size]`. The channel mean is `[0.485, 0.456, 0.406]` and standard deviation is `[0.229, 0.224, 0.225]` after scaling pixels to [0, 1]. The exported graphs target ONNX opset 18 and ONNX Runtime Web 1.31.1.

The [project license](LICENSE) accompanies the exporter. The release checkout retains the component license notices, including those in `loopdvr/models/looped_vit.py`. Keep `MODEL-LICENSE.txt` and `runtime/LICENSE.txt` with their respective assets when distributing the browser demo.
