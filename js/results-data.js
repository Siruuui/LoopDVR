// Generated from full_model_series_params_ap_2026-11-12.json and yolo_v8_and_later_params_ap_2026-11-12.json.
// Original paper-table rows take priority except YOLO26, which uses official Non-E2E/NMS results.
// Added YOLO rows use recorded NMS modes or verified official NMS inference code.
// Version provenance is retained; withdrawn historical rows are excluded.
// YOLOv9 uses only the Ultralytics integration; display names omit parenthetical suffixes.
// Only verified parameter counts at or below 70M are included.
// Detection AP must be at least 35; segmentation AP must be at least 30; pose AP must be at least 55.
// Unspecified input sizes are 640, as confirmed by the user.
window.LOOPDVR_RESULTS = {
  "asOf": "2026-11-12",
  "dataset": "COCO val2017",
  "metrics": {
    "detection": "box AP50:95",
    "instance_segmentation": "mask AP50:95",
    "pose": "keypoint AP50:95"
  },
  "models": [
    {
      "id": "detection-deimv2-pico",
      "task": "detection",
      "family": "DEIMv2",
      "model": "DEIMv2-Pico",
      "params": 1.5,
      "ap": 38.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; S/M DINOv3-distilled backbone; L/X DINOv3 backbone",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2509.20787v5"
      ]
    },
    {
      "id": "detection-deimv2-n",
      "task": "detection",
      "family": "DEIMv2",
      "model": "DEIMv2-N",
      "params": 3.6,
      "ap": 43.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; S/M DINOv3-distilled backbone; L/X DINOv3 backbone",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2509.20787v5"
      ]
    },
    {
      "id": "detection-deimv2-x",
      "task": "detection",
      "family": "DEIMv2",
      "model": "DEIMv2-X",
      "params": 50.3,
      "ap": 57.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; S/M DINOv3-distilled backbone; L/X DINOv3 backbone",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2509.20787v5"
      ]
    },
    {
      "id": "detection-deim-d-fine-n",
      "task": "detection",
      "family": "DEIM-D-FINE",
      "model": "DEIM-D-FINE-N",
      "params": 4.0,
      "ap": 43.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; official params rounded integer M",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/Intellindust-AI-Lab/DEIM#1-model-zoo"
      ]
    },
    {
      "id": "detection-deim-d-fine-x",
      "task": "detection",
      "family": "DEIM-D-FINE",
      "model": "DEIM-D-FINE-X",
      "params": 62.0,
      "ap": 56.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; official params rounded integer M",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/Intellindust-AI-Lab/DEIM#1-model-zoo"
      ]
    },
    {
      "id": "detection-d-fine-n",
      "task": "detection",
      "family": "D-FINE",
      "model": "D-FINE-N",
      "params": 4.0,
      "ap": 42.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; official params rounded integer M",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/Peterande/D-FINE#model-zoo"
      ]
    },
    {
      "id": "detection-d-fine-m",
      "task": "detection",
      "family": "D-FINE",
      "model": "D-FINE-M",
      "params": 19.0,
      "ap": 52.3,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; official params rounded integer M",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/Peterande/D-FINE#model-zoo"
      ]
    },
    {
      "id": "detection-d-fine-x",
      "task": "detection",
      "family": "D-FINE",
      "model": "D-FINE-X",
      "params": 62.0,
      "ap": 55.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; official params rounded integer M",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/Peterande/D-FINE#model-zoo"
      ]
    },
    {
      "id": "detection-rt-detrv4-s",
      "task": "detection",
      "family": "RT-DETRv4",
      "model": "RT-DETRv4-S",
      "params": 10.0,
      "ap": 49.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; DINOv3-ViT-Base semantic teacher; v2; official params rounded integer M",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2510.25257v2"
      ]
    },
    {
      "id": "detection-rt-detrv4-x",
      "task": "detection",
      "family": "RT-DETRv4",
      "model": "RT-DETRv4-X",
      "params": 62.0,
      "ap": 57.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; DINOv3-ViT-Base semantic teacher; v2; official params rounded integer M",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2510.25257v2"
      ]
    },
    {
      "id": "detection-lw-detr-tiny",
      "task": "detection",
      "family": "LW-DETR",
      "model": "LW-DETR-tiny",
      "params": 12.1,
      "ap": 42.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "Objects365 detection pretraining; original paper results",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2406.03459v1"
      ]
    },
    {
      "id": "detection-lw-detr-large",
      "task": "detection",
      "family": "LW-DETR",
      "model": "LW-DETR-large",
      "params": 46.8,
      "ap": 56.1,
      "group": "baseline",
      "resolution": 640,
      "setting": "Objects365 detection pretraining; original paper results",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2406.03459v1"
      ]
    },
    {
      "id": "detection-rf-detr-femto",
      "task": "detection",
      "family": "RF-DETR",
      "model": "RF-DETR-Femto",
      "params": 7.9,
      "ap": 37.8,
      "group": "baseline",
      "resolution": 384,
      "setting": "Current official checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://rfdetr.roboflow.com/latest/learn/run/detection/"
      ]
    },
    {
      "id": "detection-rf-detr-nano",
      "task": "detection",
      "family": "RF-DETR",
      "model": "RF-DETR-Nano",
      "params": 30.5,
      "ap": 48.4,
      "group": "baseline",
      "resolution": 384,
      "setting": "Current official checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://rfdetr.roboflow.com/latest/learn/run/detection/"
      ]
    },
    {
      "id": "instance-segmentation-rf-detr-seg-nano",
      "task": "instance_segmentation",
      "family": "RF-DETR",
      "model": "RF-DETR-Seg-Nano",
      "params": 33.6,
      "ap": 40.3,
      "group": "baseline",
      "resolution": 312,
      "setting": "Current official checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://rfdetr.roboflow.com/latest/learn/run/segmentation/"
      ]
    },
    {
      "id": "instance-segmentation-rf-detr-seg-small",
      "task": "instance_segmentation",
      "family": "RF-DETR",
      "model": "RF-DETR-Seg-Small",
      "params": 33.7,
      "ap": 43.1,
      "group": "baseline",
      "resolution": 384,
      "setting": "Current official checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://rfdetr.roboflow.com/latest/learn/run/segmentation/"
      ]
    },
    {
      "id": "instance-segmentation-rf-detr-seg-2xlarge",
      "task": "instance_segmentation",
      "family": "RF-DETR",
      "model": "RF-DETR-Seg-2XLarge",
      "params": 38.6,
      "ap": 49.9,
      "group": "baseline",
      "resolution": 768,
      "setting": "Current official checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://rfdetr.roboflow.com/latest/learn/run/segmentation/"
      ]
    },
    {
      "id": "instance-segmentation-rf-detr-seg-max",
      "task": "instance_segmentation",
      "family": "RF-DETR",
      "model": "RF-DETR-Seg-Max",
      "params": 40.1,
      "ap": 50.5,
      "group": "baseline",
      "resolution": 890,
      "setting": "Paper NAS configuration",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2511.09554v2#Sx5.T13"
      ]
    },
    {
      "id": "detection-rf-detr-base-legacy-2025",
      "task": "detection",
      "family": "RF-DETR",
      "model": "RF-DETR-Base",
      "params": 29.0,
      "ap": 53.3,
      "group": "baseline",
      "resolution": 560,
      "setting": "Legacy checkpoint, official report",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/roboflow/rf-detr/blob/5e2979d55e2aab0da80bd8a8ca8cf09c6f4ab909/README.md"
      ]
    },
    {
      "id": "pose-detrpose-n",
      "task": "pose",
      "family": "DETRPose",
      "model": "DETRPose-N",
      "params": 4.1,
      "ap": 57.2,
      "group": "baseline",
      "resolution": "640x640",
      "setting": "D-FINE Objects365 pretrained",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/SebastianJanampa/DETRPose#model-zoo"
      ]
    },
    {
      "id": "detection-yolov12-turbo-n-original-author-turbo",
      "task": "detection",
      "family": "YOLOv12-turbo",
      "model": "YOLOv12-turbo-N",
      "params": 2.5,
      "ap": 40.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Original author turbo",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-yolov12-turbo-x-original-author-turbo",
      "task": "detection",
      "family": "YOLOv12-turbo",
      "model": "YOLOv12-turbo-X",
      "params": 59.3,
      "ap": 55.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Original author turbo",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-yolov12-v1-0-n-original-author-v1-0",
      "task": "detection",
      "family": "YOLOv12-v1.0",
      "model": "YOLOv12-v1.0-N",
      "params": 2.6,
      "ap": 40.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Original author v1.0",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-yolov12-v1-0-s-original-author-v1-0",
      "task": "detection",
      "family": "YOLOv12-v1.0",
      "model": "YOLOv12-v1.0-S",
      "params": 9.3,
      "ap": 48.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Original author v1.0",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-yolov12-v1-0-m-original-author-v1-0",
      "task": "detection",
      "family": "YOLOv12-v1.0",
      "model": "YOLOv12-v1.0-M",
      "params": 20.2,
      "ap": 52.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Original author v1.0",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-yolov12-v1-0-l-original-author-v1-0",
      "task": "detection",
      "family": "YOLOv12-v1.0",
      "model": "YOLOv12-v1.0-L",
      "params": 26.4,
      "ap": 53.7,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Original author v1.0",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-yolov12-v1-0-x-original-author-v1-0",
      "task": "detection",
      "family": "YOLOv12-v1.0",
      "model": "YOLOv12-v1.0-X",
      "params": 59.1,
      "ap": 55.2,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Original author v1.0",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-yolo26-n-official-reported-benchmark",
      "task": "detection",
      "family": "YOLO26",
      "model": "YOLO26-N",
      "params": 2.4,
      "ap": 40.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/macros/yolo-det-perf.md"
      ]
    },
    {
      "id": "detection-yolo26-s-official-reported-benchmark",
      "task": "detection",
      "family": "YOLO26",
      "model": "YOLO26-S",
      "params": 9.5,
      "ap": 48.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/macros/yolo-det-perf.md"
      ]
    },
    {
      "id": "detection-yolo26-m-official-reported-benchmark",
      "task": "detection",
      "family": "YOLO26",
      "model": "YOLO26-M",
      "params": 20.4,
      "ap": 53.1,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/macros/yolo-det-perf.md"
      ]
    },
    {
      "id": "detection-yolo26-l-official-reported-benchmark",
      "task": "detection",
      "family": "YOLO26",
      "model": "YOLO26-L",
      "params": 24.8,
      "ap": 55.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/macros/yolo-det-perf.md"
      ]
    },
    {
      "id": "detection-yolo26-x-official-reported-benchmark",
      "task": "detection",
      "family": "YOLO26",
      "model": "YOLO26-X",
      "params": 55.7,
      "ap": 57.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/macros/yolo-det-perf.md"
      ]
    },
    {
      "id": "instance-segmentation-yolov12-seg-n-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLOv12-seg",
      "model": "YOLOv12-seg-N",
      "params": 2.8,
      "ap": 32.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "instance-segmentation-yolov12-seg-x-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLOv12-seg",
      "model": "YOLOv12-seg-X",
      "params": 64.5,
      "ap": 44.2,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "instance-segmentation-yolo11-seg-n-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLO11-seg",
      "model": "YOLO11-seg-N",
      "params": 2.9,
      "ap": 32.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "instance-segmentation-yolo11-seg-x-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLO11-seg",
      "model": "YOLO11-seg-X",
      "params": 62.1,
      "ap": 43.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "instance-segmentation-yolo26-seg-n-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLO26-seg",
      "model": "YOLO26-seg-N",
      "params": 2.7,
      "ap": 34.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "instance-segmentation-yolo26-seg-s-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLO26-seg",
      "model": "YOLO26-seg-S",
      "params": 10.4,
      "ap": 40.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "instance-segmentation-yolo26-seg-m-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLO26-seg",
      "model": "YOLO26-seg-M",
      "params": 23.6,
      "ap": 44.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "instance-segmentation-yolo26-seg-l-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLO26-seg",
      "model": "YOLO26-seg-L",
      "params": 28.0,
      "ap": 46.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "instance-segmentation-yolo26-seg-x-official-reported-benchmark",
      "task": "instance_segmentation",
      "family": "YOLO26-seg",
      "model": "YOLO26-seg-X",
      "params": 62.8,
      "ap": 47.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "pose-yolo11-pose-l-official-reported-benchmark",
      "task": "pose",
      "family": "YOLO11-pose",
      "model": "YOLO11-pose-L",
      "params": 26.1,
      "ap": 66.1,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "pose-yolo11-pose-x-official-reported-benchmark",
      "task": "pose",
      "family": "YOLO11-pose",
      "model": "YOLO11-pose-X",
      "params": 58.8,
      "ap": 69.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "pose-yolo26-pose-n-official-reported-benchmark",
      "task": "pose",
      "family": "YOLO26-pose",
      "model": "YOLO26-pose-N",
      "params": 2.9,
      "ap": 57.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "pose-yolo26-pose-s-official-reported-benchmark",
      "task": "pose",
      "family": "YOLO26-pose",
      "model": "YOLO26-pose-S",
      "params": 10.4,
      "ap": 62.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "pose-yolo26-pose-m-official-reported-benchmark",
      "task": "pose",
      "family": "YOLO26-pose",
      "model": "YOLO26-pose-M",
      "params": 21.5,
      "ap": 68.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "pose-yolo26-pose-l-official-reported-benchmark",
      "task": "pose",
      "family": "YOLO26-pose",
      "model": "YOLO26-pose-L",
      "params": 25.9,
      "ap": 70.3,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "pose-yolo26-pose-x-official-reported-benchmark",
      "task": "pose",
      "family": "YOLO26-pose",
      "model": "YOLO26-pose-X",
      "params": 57.6,
      "ap": 71.7,
      "group": "baseline",
      "resolution": 640,
      "setting": "Non-E2E/NMS; Official reported benchmark",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://arxiv.org/html/2606.03748v1#S5"
      ]
    },
    {
      "id": "detection-yolov8-n-ultralytics-official-current",
      "task": "detection",
      "family": "YOLOv8",
      "model": "YOLOv8-N",
      "params": 3.2,
      "ap": 37.3,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "detection-yolov8-s-ultralytics-official-current",
      "task": "detection",
      "family": "YOLOv8",
      "model": "YOLOv8-S",
      "params": 11.2,
      "ap": 44.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "detection-yolov8-m-ultralytics-official-current",
      "task": "detection",
      "family": "YOLOv8",
      "model": "YOLOv8-M",
      "params": 25.9,
      "ap": 50.2,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "detection-yolov8-l-ultralytics-official-current",
      "task": "detection",
      "family": "YOLOv8",
      "model": "YOLOv8-L",
      "params": 43.7,
      "ap": 52.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "detection-yolov8-x-ultralytics-official-current",
      "task": "detection",
      "family": "YOLOv8",
      "model": "YOLOv8-X",
      "params": 68.2,
      "ap": 53.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "instance-segmentation-yolov8-seg-n-ultralytics-official-current",
      "task": "instance_segmentation",
      "family": "YOLOv8-seg",
      "model": "YOLOv8-seg-N",
      "params": 3.4,
      "ap": 30.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "instance-segmentation-yolov8-seg-s-ultralytics-official-current",
      "task": "instance_segmentation",
      "family": "YOLOv8-seg",
      "model": "YOLOv8-seg-S",
      "params": 11.8,
      "ap": 36.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "instance-segmentation-yolov8-seg-m-ultralytics-official-current",
      "task": "instance_segmentation",
      "family": "YOLOv8-seg",
      "model": "YOLOv8-seg-M",
      "params": 27.3,
      "ap": 40.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "instance-segmentation-yolov8-seg-l-ultralytics-official-current",
      "task": "instance_segmentation",
      "family": "YOLOv8-seg",
      "model": "YOLOv8-seg-L",
      "params": 46.0,
      "ap": 42.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "pose-yolov8-pose-s-ultralytics-official-current",
      "task": "pose",
      "family": "YOLOv8-pose",
      "model": "YOLOv8-pose-S",
      "params": 11.6,
      "ap": 60.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "pose-yolov8-pose-m-ultralytics-official-current",
      "task": "pose",
      "family": "YOLOv8-pose",
      "model": "YOLOv8-pose-M",
      "params": 26.4,
      "ap": 65.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "pose-yolov8-pose-l-ultralytics-official-current",
      "task": "pose",
      "family": "YOLOv8-pose",
      "model": "YOLOv8-pose-L",
      "params": 44.5,
      "ap": 67.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "pose-yolov8-pose-x-ultralytics-official-current",
      "task": "pose",
      "family": "YOLOv8-pose",
      "model": "YOLOv8-pose-X",
      "params": 69.5,
      "ap": 69.2,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov8.md"
      ]
    },
    {
      "id": "detection-yolo11-n-ultralytics-official-current",
      "task": "detection",
      "family": "YOLO11",
      "model": "YOLO11-N",
      "params": 2.6,
      "ap": 39.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "detection-yolo11-s-ultralytics-official-current",
      "task": "detection",
      "family": "YOLO11",
      "model": "YOLO11-S",
      "params": 9.4,
      "ap": 47.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "detection-yolo11-m-ultralytics-official-current",
      "task": "detection",
      "family": "YOLO11",
      "model": "YOLO11-M",
      "params": 20.1,
      "ap": 51.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "detection-yolo11-l-ultralytics-official-current",
      "task": "detection",
      "family": "YOLO11",
      "model": "YOLO11-L",
      "params": 25.3,
      "ap": 53.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "detection-yolo11-x-ultralytics-official-current",
      "task": "detection",
      "family": "YOLO11",
      "model": "YOLO11-X",
      "params": 56.9,
      "ap": 54.7,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics official current",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "detection-yolov9-t-ultralytics-integration",
      "task": "detection",
      "family": "YOLOv9",
      "model": "YOLOv9-T",
      "params": 2.0,
      "ap": 38.3,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics integration",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov9.md"
      ]
    },
    {
      "id": "detection-yolov9-s-ultralytics-integration",
      "task": "detection",
      "family": "YOLOv9",
      "model": "YOLOv9-S",
      "params": 7.2,
      "ap": 46.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics integration",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov9.md"
      ]
    },
    {
      "id": "detection-yolov9-m-ultralytics-integration",
      "task": "detection",
      "family": "YOLOv9",
      "model": "YOLOv9-M",
      "params": 20.1,
      "ap": 51.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics integration",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov9.md"
      ]
    },
    {
      "id": "detection-yolov9-c-ultralytics-integration",
      "task": "detection",
      "family": "YOLOv9",
      "model": "YOLOv9-C",
      "params": 25.5,
      "ap": 53.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics integration",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov9.md"
      ]
    },
    {
      "id": "detection-yolov9-e-ultralytics-integration",
      "task": "detection",
      "family": "YOLOv9",
      "model": "YOLOv9-E",
      "params": 58.1,
      "ap": 55.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics integration",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov9.md"
      ]
    },
    {
      "id": "instance-segmentation-gelan-seg-c-original-author-released-weights",
      "task": "instance_segmentation",
      "family": "GELAN-seg",
      "model": "GELAN-seg-C",
      "params": 27.4,
      "ap": 42.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Original author released weights; Related model from the YOLOv9 repository",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/WongKinYiu/yolov9/main/README.md"
      ]
    },
    {
      "id": "instance-segmentation-yolov9-seg-c-ultralytics-integration",
      "task": "instance_segmentation",
      "family": "YOLOv9-seg",
      "model": "YOLOv9-seg-C",
      "params": 27.9,
      "ap": 42.2,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics integration",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov9.md"
      ]
    },
    {
      "id": "instance-segmentation-yolov9-seg-e-ultralytics-integration",
      "task": "instance_segmentation",
      "family": "YOLOv9-seg",
      "model": "YOLOv9-seg-E",
      "params": 60.5,
      "ap": 44.3,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS; Ultralytics integration",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolov9.md"
      ]
    },
    {
      "id": "detection-yolov13-n",
      "task": "detection",
      "family": "YOLOv13",
      "model": "YOLOv13-N",
      "params": 2.5,
      "ap": 41.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS inference verified in official source; NMS; Released author checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/iMoonLab/yolov13#1-ms-coco-benchmark",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/cfg/models/v13/yolov13.yaml",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/nn/modules/head.py",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/models/yolo/detect/val.py",
        "https://arxiv.org/html/2506.17733v1"
      ]
    },
    {
      "id": "detection-yolov13-s",
      "task": "detection",
      "family": "YOLOv13",
      "model": "YOLOv13-S",
      "params": 9.0,
      "ap": 48.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS inference verified in official source; NMS; Released author checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/iMoonLab/yolov13#1-ms-coco-benchmark",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/cfg/models/v13/yolov13.yaml",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/nn/modules/head.py",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/models/yolo/detect/val.py",
        "https://arxiv.org/html/2506.17733v1"
      ]
    },
    {
      "id": "detection-yolov13-l",
      "task": "detection",
      "family": "YOLOv13",
      "model": "YOLOv13-L",
      "params": 27.6,
      "ap": 53.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS inference verified in official source; NMS; Released author checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/iMoonLab/yolov13#1-ms-coco-benchmark",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/cfg/models/v13/yolov13.yaml",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/nn/modules/head.py",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/models/yolo/detect/val.py",
        "https://arxiv.org/html/2506.17733v1"
      ]
    },
    {
      "id": "detection-yolov13-x",
      "task": "detection",
      "family": "YOLOv13",
      "model": "YOLOv13-X",
      "params": 64.0,
      "ap": 54.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS inference verified in official source; NMS; Released author checkpoint",
      "sourceLabel": "Official source",
      "sourceUrls": [
        "https://github.com/iMoonLab/yolov13#1-ms-coco-benchmark",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/cfg/models/v13/yolov13.yaml",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/nn/modules/head.py",
        "https://raw.githubusercontent.com/iMoonLab/yolov13/main/ultralytics/models/yolo/detect/val.py",
        "https://arxiv.org/html/2506.17733v1"
      ]
    },
    {
      "id": "detection-yolov12-s-turbo",
      "task": "detection",
      "family": "YOLOv12-turbo",
      "model": "YOLOv12-S-turbo",
      "params": 9.1,
      "ap": 47.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-deimv2-s",
      "task": "detection",
      "family": "DEIMv2",
      "model": "DEIMv2-S",
      "params": 9.7,
      "ap": 50.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; S/M DINOv3-distilled backbone; L/X DINOv3 backbone",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": [
        "https://arxiv.org/html/2509.20787v5"
      ]
    },
    {
      "id": "detection-rf-detr-p",
      "task": "detection",
      "family": "RF-DETR",
      "model": "RF-DETR-P",
      "params": 8.5,
      "ap": 41.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-ecdet-s",
      "task": "detection",
      "family": "ECDet",
      "model": "ECDet-S",
      "params": 9.8,
      "ap": 51.7,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-loopdet-s",
      "task": "detection",
      "family": "LoopDet",
      "model": "LoopDet-S",
      "params": 7.0,
      "ap": 50.9,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-d-fine-s",
      "task": "detection",
      "family": "D-FINE",
      "model": "D-FINE-S",
      "params": 10.2,
      "ap": 48.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-lw-detr-s",
      "task": "detection",
      "family": "LW-DETR",
      "model": "LW-DETR-S",
      "params": 14.6,
      "ap": 48.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "Objects365 detection pretraining; original paper results",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": [
        "https://arxiv.org/html/2406.03459v1"
      ]
    },
    {
      "id": "detection-yolov12-m-turbo",
      "task": "detection",
      "family": "YOLOv12-turbo",
      "model": "YOLOv12-M-turbo",
      "params": 19.6,
      "ap": 52.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-deim-s",
      "task": "detection",
      "family": "DEIM-D-FINE",
      "model": "DEIM-S",
      "params": 10.2,
      "ap": 49.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-deim-m",
      "task": "detection",
      "family": "DEIM-D-FINE",
      "model": "DEIM-M",
      "params": 19.2,
      "ap": 52.7,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-deimv2-m",
      "task": "detection",
      "family": "DEIMv2",
      "model": "DEIMv2-M",
      "params": 18.1,
      "ap": 53.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; S/M DINOv3-distilled backbone; L/X DINOv3 backbone",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": [
        "https://arxiv.org/html/2509.20787v5"
      ]
    },
    {
      "id": "detection-rt-detrv4-m",
      "task": "detection",
      "family": "RT-DETRv4",
      "model": "RT-DETRv4-M",
      "params": 19.4,
      "ap": 53.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-ecdet-m",
      "task": "detection",
      "family": "ECDet",
      "model": "ECDet-M",
      "params": 19.2,
      "ap": 54.3,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-loopdet-m",
      "task": "detection",
      "family": "LoopDet",
      "model": "LoopDet-M",
      "params": 13.9,
      "ap": 54.0,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-lw-detr-m",
      "task": "detection",
      "family": "LW-DETR",
      "model": "LW-DETR-M",
      "params": 28.2,
      "ap": 52.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-yolov12-l-turbo",
      "task": "detection",
      "family": "YOLOv12-turbo",
      "model": "YOLOv12-L-turbo",
      "params": 26.5,
      "ap": 53.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "detection-ecdet-l",
      "task": "detection",
      "family": "ECDet",
      "model": "ECDet-L",
      "params": 32.7,
      "ap": 57.0,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-loopdet-l",
      "task": "detection",
      "family": "LoopDet",
      "model": "LoopDet-L",
      "params": 23.4,
      "ap": 56.6,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-d-fine-l",
      "task": "detection",
      "family": "D-FINE",
      "model": "D-FINE-L",
      "params": 30.7,
      "ap": 54.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-deim-l",
      "task": "detection",
      "family": "DEIM-D-FINE",
      "model": "DEIM-L",
      "params": 30.8,
      "ap": 54.7,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-deimv2-l",
      "task": "detection",
      "family": "DEIMv2",
      "model": "DEIMv2-L",
      "params": 32.2,
      "ap": 56.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; S/M DINOv3-distilled backbone; L/X DINOv3 backbone",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": [
        "https://arxiv.org/html/2509.20787v5"
      ]
    },
    {
      "id": "detection-rt-detrv4-l",
      "task": "detection",
      "family": "RT-DETRv4",
      "model": "RT-DETRv4-L",
      "params": 31.0,
      "ap": 55.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "COCO; DINOv3-ViT-Base semantic teacher; v2; official params rounded integer M",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": [
        "https://arxiv.org/html/2510.25257v2"
      ]
    },
    {
      "id": "detection-rf-detr-s",
      "task": "detection",
      "family": "RF-DETR",
      "model": "RF-DETR-S",
      "params": 32.3,
      "ap": 54.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-rf-detr-m",
      "task": "detection",
      "family": "RF-DETR",
      "model": "RF-DETR-M",
      "params": 33.8,
      "ap": 55.2,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-rf-detr-l",
      "task": "detection",
      "family": "RF-DETR",
      "model": "RF-DETR-L",
      "params": 33.8,
      "ap": 56.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-ecdet-x",
      "task": "detection",
      "family": "ECDet",
      "model": "ECDet-X",
      "params": 49.0,
      "ap": 57.9,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "detection-loopdet-x",
      "task": "detection",
      "family": "LoopDet",
      "model": "LoopDet-X",
      "params": 35.1,
      "ap": 57.5,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S4",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-yolo-ms-xs-seg",
      "task": "instance_segmentation",
      "family": "YOLO-MS-Seg",
      "model": "YOLO-MS-XS-Seg",
      "params": 5.1,
      "ap": 36.6,
      "group": "baseline",
      "resolution": "640x640",
      "setting": "COCO",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": [
        "https://mftp.mmcheng.net/Papers/25PAMI-YOLOMS.pdf"
      ]
    },
    {
      "id": "instance-segmentation-yolov12-seg-s",
      "task": "instance_segmentation",
      "family": "YOLOv12-seg",
      "model": "YOLOv12-Seg-S",
      "params": 9.8,
      "ap": 38.6,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": [
        "https://github.com/sunsmarterjie/yolov12#main-results"
      ]
    },
    {
      "id": "instance-segmentation-ecinsseg-s",
      "task": "instance_segmentation",
      "family": "ECInsSeg",
      "model": "ECInsSeg-S",
      "params": 10.3,
      "ap": 43.0,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-loopseg-s",
      "task": "instance_segmentation",
      "family": "LoopSeg",
      "model": "LoopSeg-S",
      "params": 7.4,
      "ap": 43.0,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-yolo11-seg-s",
      "task": "instance_segmentation",
      "family": "YOLO11-seg",
      "model": "YOLO11-Seg-S",
      "params": 10.1,
      "ap": 37.8,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "instance-segmentation-ecinsseg-m",
      "task": "instance_segmentation",
      "family": "ECInsSeg",
      "model": "ECInsSeg-M",
      "params": 20.1,
      "ap": 45.2,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-loopseg-m",
      "task": "instance_segmentation",
      "family": "LoopSeg",
      "model": "LoopSeg-M",
      "params": 14.6,
      "ap": 45.5,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-yolo11-seg-m",
      "task": "instance_segmentation",
      "family": "YOLO11-seg",
      "model": "YOLO11-Seg-M",
      "params": 22.4,
      "ap": 41.5,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "instance-segmentation-yolo11-seg-l",
      "task": "instance_segmentation",
      "family": "YOLO11-seg",
      "model": "YOLO11-Seg-L",
      "params": 27.6,
      "ap": 42.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "instance-segmentation-yolov12-seg-m",
      "task": "instance_segmentation",
      "family": "YOLOv12-seg",
      "model": "YOLOv12-Seg-M",
      "params": 21.9,
      "ap": 42.2,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-yolov12-seg-l",
      "task": "instance_segmentation",
      "family": "YOLOv12-seg",
      "model": "YOLOv12-Seg-L",
      "params": 28.8,
      "ap": 43.1,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-ecinsseg-l",
      "task": "instance_segmentation",
      "family": "ECInsSeg",
      "model": "ECInsSeg-L",
      "params": 33.6,
      "ap": 47.1,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-loopseg-l",
      "task": "instance_segmentation",
      "family": "LoopSeg",
      "model": "LoopSeg-L",
      "params": 24.1,
      "ap": 48.1,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-rf-detr-seg-m",
      "task": "instance_segmentation",
      "family": "RF-DETR",
      "model": "RF-DETR-Seg-M",
      "params": 35.7,
      "ap": 45.3,
      "group": "baseline",
      "resolution": 432,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": [
        "https://rfdetr.roboflow.com/latest/learn/run/segmentation/"
      ]
    },
    {
      "id": "instance-segmentation-rf-detr-seg-l",
      "task": "instance_segmentation",
      "family": "RF-DETR",
      "model": "RF-DETR-Seg-L",
      "params": 36.2,
      "ap": 47.1,
      "group": "baseline",
      "resolution": 504,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": [
        "https://rfdetr.roboflow.com/latest/learn/run/segmentation/"
      ]
    },
    {
      "id": "instance-segmentation-rf-detr-seg-x",
      "task": "instance_segmentation",
      "family": "RF-DETR",
      "model": "RF-DETR-Seg-X",
      "params": 38.1,
      "ap": 48.8,
      "group": "baseline",
      "resolution": 624,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": [
        "https://rfdetr.roboflow.com/latest/learn/run/segmentation/"
      ]
    },
    {
      "id": "instance-segmentation-ecinsseg-x",
      "task": "instance_segmentation",
      "family": "ECInsSeg",
      "model": "ECInsSeg-X",
      "params": 49.9,
      "ap": 48.4,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "instance-segmentation-loopseg-x",
      "task": "instance_segmentation",
      "family": "LoopSeg",
      "model": "LoopSeg-X",
      "params": 35.8,
      "ap": 48.9,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S6",
      "sourceUrls": []
    },
    {
      "id": "pose-rtmo-t",
      "task": "pose",
      "family": "RTMO",
      "model": "RTMO-T",
      "params": 6.8,
      "ap": 63.4,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-rtmo-s",
      "task": "pose",
      "family": "RTMO",
      "model": "RTMO-S",
      "params": 9.9,
      "ap": 67.7,
      "group": "baseline",
      "resolution": "640x640",
      "setting": "COCO-only",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": [
        "https://github.com/open-mmlab/mmpose/blob/main/projects/rtmo/README.md",
        "https://arxiv.org/html/2312.07526v2#S4.T1"
      ]
    },
    {
      "id": "pose-yolo11-pose-s",
      "task": "pose",
      "family": "YOLO11-pose",
      "model": "YOLO11-Pose-S",
      "params": 9.9,
      "ap": 58.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "pose-ecpose-s",
      "task": "pose",
      "family": "ECPose",
      "model": "ECPose-S",
      "params": 9.9,
      "ap": 68.9,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-looppose-s",
      "task": "pose",
      "family": "LoopPose",
      "model": "LoopPose-S",
      "params": 7.7,
      "ap": 68.2,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-detrpose-s",
      "task": "pose",
      "family": "DETRPose",
      "model": "DETRPose-S",
      "params": 11.5,
      "ap": 67.0,
      "group": "baseline",
      "resolution": "640x640",
      "setting": "D-FINE Objects365 pretrained",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": [
        "https://github.com/SebastianJanampa/DETRPose#model-zoo"
      ]
    },
    {
      "id": "pose-ecpose-m",
      "task": "pose",
      "family": "ECPose",
      "model": "ECPose-M",
      "params": 19.8,
      "ap": 72.4,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-looppose-m",
      "task": "pose",
      "family": "LoopPose",
      "model": "LoopPose-M",
      "params": 14.6,
      "ap": 71.8,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-rtmo-m",
      "task": "pose",
      "family": "RTMO",
      "model": "RTMO-M",
      "params": 22.6,
      "ap": 71.0,
      "group": "baseline",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-yolo11-pose-m",
      "task": "pose",
      "family": "YOLO11-pose",
      "model": "YOLO11-Pose-M",
      "params": 20.9,
      "ap": 64.9,
      "group": "baseline",
      "resolution": 640,
      "setting": "NMS",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": [
        "https://raw.githubusercontent.com/ultralytics/ultralytics/main/docs/en/models/yolo11.md"
      ]
    },
    {
      "id": "pose-detrpose-m",
      "task": "pose",
      "family": "DETRPose",
      "model": "DETRPose-M",
      "params": 20.8,
      "ap": 69.4,
      "group": "baseline",
      "resolution": "640x640",
      "setting": "D-FINE Objects365 pretrained",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": [
        "https://github.com/SebastianJanampa/DETRPose#model-zoo"
      ]
    },
    {
      "id": "pose-ecpose-l",
      "task": "pose",
      "family": "ECPose",
      "model": "ECPose-L",
      "params": 34.3,
      "ap": 73.5,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-looppose-l",
      "task": "pose",
      "family": "LoopPose",
      "model": "LoopPose-L",
      "params": 24.6,
      "ap": 72.9,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-rtmo-l",
      "task": "pose",
      "family": "RTMO",
      "model": "RTMO-L",
      "params": 44.8,
      "ap": 72.4,
      "group": "baseline",
      "resolution": "640x640",
      "setting": "COCO-only",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": [
        "https://github.com/open-mmlab/mmpose/blob/main/projects/rtmo/README.md",
        "https://arxiv.org/html/2312.07526v2#S4.T1"
      ]
    },
    {
      "id": "pose-detrpose-l",
      "task": "pose",
      "family": "DETRPose",
      "model": "DETRPose-L",
      "params": 32.8,
      "ap": 72.5,
      "group": "baseline",
      "resolution": "640x640",
      "setting": "D-FINE Objects365 pretrained",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": [
        "https://github.com/SebastianJanampa/DETRPose#model-zoo"
      ]
    },
    {
      "id": "pose-ecpose-x",
      "task": "pose",
      "family": "ECPose",
      "model": "ECPose-X",
      "params": 50.6,
      "ap": 74.8,
      "group": "edgecrafter",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    },
    {
      "id": "pose-looppose-x",
      "task": "pose",
      "family": "LoopPose",
      "model": "LoopPose-X",
      "params": 36.3,
      "ap": 74.3,
      "group": "loopdvr",
      "resolution": 640,
      "setting": "",
      "sourceLabel": "Paper Table S7",
      "sourceUrls": []
    }
  ]
};
