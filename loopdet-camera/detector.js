import * as ort from './runtime/ort.webgpu.min.mjs';

const size = Number(new URL(import.meta.url).searchParams.get('size') ?? 640);
if (![640, 512].includes(size)) throw new Error('不支持的模型输入尺寸');
const area = size * size;
const canvas = new OffscreenCanvas(size, size);
const ctx = canvas.getContext('2d', {willReadFrequently: true});
ctx.imageSmoothingQuality = 'high';
const pixels = new Float32Array(area * 3);
const mean = [0.485, 0.456, 0.406];
const std = [0.229, 0.224, 0.225];
const rgb = mean.map((m, channel) => Float32Array.from({length: 256}, (_, v) => (v / 255 - m) / std[channel]));
const input = new ort.Tensor('float32', pixels, [1, 3, size, size]);
let session;

async function load() {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) {
    throw new Error('WebGPU 无法使用，请在开启硬件加速的桌面 Chrome 或 Edge 中打开。');
  }
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = new URL('./runtime/', import.meta.url).href;
  const precision = adapter.features.has('shader-f16') ? 'fp16' : 'fp32';
  const model = new URL(`./loopdet-s-${size}-${precision}.onnx`, import.meta.url);
  session = await ort.InferenceSession.create(model.href, {
    executionProviders: ['webgpu', 'wasm'],
    graphOptimizationLevel: 'all',
  });
  self.postMessage({type: 'ready', precision});
}

async function infer(videoFrame) {
  ctx.drawImage(videoFrame, 0, 0, size, size);
  const rgba = ctx.getImageData(0, 0, size, size).data;
  for (let i = 0, j = 0; i < area; i++, j += 4) {
    pixels[i] = rgb[0][rgba[j]];
    pixels[i + area] = rgb[1][rgba[j + 1]];
    pixels[i + 2 * area] = rgb[2][rgba[j + 2]];
  }
  const start = performance.now();
  let output;
  try {
    output = await session.run({images: input});
    const ms = performance.now() - start;
    const {boxes, scores, labels} = output;
    const results = [];
    for (let i = 0; i < scores.data.length && scores.data[i] >= 0.05; i++) {
      results.push({label: labels.data[i], score: scores.data[i], box: Array.from(boxes.data.subarray(i * 4, i * 4 + 4))});
    }
    self.postMessage({type: 'frame', frame: videoFrame, results, ms}, [videoFrame]);
  } finally {
    if (output) Object.values(output).forEach(tensor => tensor.dispose());
  }
}

self.onmessage = async ({data}) => {
  try {
    if (data.type === 'load') await load();
    if (data.type === 'frame') await infer(data.frame);
  } catch (error) {
    data.frame?.close();
    self.postMessage({type: 'error', message: error?.message || String(error)});
  }
};
