# Export the webcam models

Both profiles use the released LoopDet-S checkpoint and run all 12 backbone steps. They retain the 100 highest-scoring encoder proposals and exit after the second decoder refinement. At this exit the release model uses the first decoder group's trained classification and localization-quality heads and the current refined boxes. The 640 × 640 profile preserves the release input resolution. The 512 × 512 profile uses a smaller patch grid with the same model and exit.

## Rebuild

Use Python 3.11 and the [LoopDVR release checkout](https://github.com/Siruuui/LoopDVR/tree/16cb569312cd3bbc2ec827f7ca4a0111fa453553). Place the released `loopdet-s.pth` in the checkout’s `weights/` directory. Its SHA-256 is `67b11c0d6b20096362b6f3e6930bd9748a4083cc3e4affa93c8689bf29c3d307`.

From this exporter directory, set `LOOPDVR_REPO` to that checkout and run the following commands. The conversion runs on the CPU.

```sh
python3.11 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python export.py --repo "$LOOPDVR_REPO" --weights "$LOOPDVR_REPO/weights/loopdet-s.pth" --output models
```

The command writes `loopdet-s-640-fp32.onnx`, `loopdet-s-640-fp16.onnx`, `loopdet-s-512-fp32.onnx` and `loopdet-s-512-fp16.onnx`. Pass `--size 640` or `--size 512` to build one pair. The page selects FP16 when the WebGPU adapter exposes `shader-f16`.

Both profiles accept float32 RGB input `images` with shape `[1, 3, size, size]`. Before inference the page scales channels to `[0, 1]` and normalizes with the release mean `[0.485, 0.456, 0.406]` and standard deviation `[0.229, 0.224, 0.225]`. Each model emits 100 normalized `xyxy` boxes, descending scores and contiguous int32 COCO labels.

The exporter traces ONNX opset 18, fuses rotary embedding, exact GELU and 15 attention operations, and vectorizes box refinement. It folds constant subgraphs before generating the two precisions. The graphs use ONNX Runtime’s `com.microsoft` operators and run with ONNX Runtime Web 1.31.1.

The [project license](LICENSE) accompanies the exporter. The release checkout retains the component license notices, including those in `loopdvr/models/looped_vit.py`. When distributing the browser demo, keep its `MODEL-LICENSE.txt` and the ONNX Runtime license in `runtime/LICENSE.txt` alongside their respective assets.
