// COCO's 19 limbs, grouped using the LoopDVR visualization's left, right and center colors.
const skeleton = [
  ['#ff8c00', [[15, 13], [13, 11], [5, 11], [5, 7], [7, 9], [0, 1], [1, 3], [3, 5]]],
  ['#776bff', [[16, 14], [14, 12], [6, 12], [6, 8], [8, 10], [0, 2], [2, 4], [4, 6]]],
  ['#b62cff', [[11, 12], [5, 6], [1, 2]]],
];

export function drawPose(ctx, result, width, height, unit) {
  const points = result.keypoints;
  if (points?.length !== 34) return;
  ctx.save();
  ctx.lineWidth = 3 * unit;
  ctx.lineCap = 'round';
  for (const [color, edges] of skeleton) {
    ctx.beginPath();
    for (const [from, to] of edges) {
      const x = points[2 * from] * width, y = points[2 * from + 1] * height;
      const u = points[2 * to] * width, v = points[2 * to + 1] * height;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(u) || !Number.isFinite(v)) continue;
      ctx.moveTo(x, y);
      ctx.lineTo(u, v);
    }
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  const radius = 2.7 * unit;
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i], y = points[i + 1];
    if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) continue;
    ctx.moveTo(x * width + radius, y * height);
    ctx.arc(x * width, y * height, radius, 0, 2 * Math.PI);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#19221e';
  ctx.lineWidth = unit;
  ctx.stroke();
  ctx.restore();
}

// Use the detector's HSL palette (92% saturation, 70% lightness) on both canvases.
function packedClassColor(label) {
  const hue = ((83 + label * 47) % 360) / 60;
  const channel = offset => {
    const k = (offset + hue) % 6;
    return Math.round(255 * (0.976 - 0.552 * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return (channel(5) << 16) | (channel(3) << 8) | channel(1);
}

export function classColor(label) {
  return '#' + packedClassColor(label).toString(16).padStart(6, '0');
}

function visibleBoxArea(box) {
  if (box?.length !== 4 || !box.every(Number.isFinite)) return Infinity;
  const width = Math.max(0, Math.min(1, box[2]) - Math.max(0, box[0]));
  const height = Math.max(0, Math.min(1, box[3]) - Math.max(0, box[1]));
  return width * height;
}

const maskShader = `
struct Instance {
  plane: u32, color: u32,
}
struct Frame {
  width: u32, height: u32, side: u32, count: u32,
  instances: array<Instance>,
}
@group(0) @binding(0) var<storage, read> frame: Frame;
@group(0) @binding(1) var<storage, read> logits: array<f32>;

@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let triangle = array(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));
  return vec4f(triangle[i], 0, 1);
}

@fragment fn fs(@builtin(position) pixel: vec4f) -> @location(0) vec4f {
  // Both coordinate systems have a top-left origin. Sample pixel centers, matching
  // PyTorch interpolate(bilinear, align_corners=False) with replicated edge pixels.
  let end = frame.side - 1u;
  let xy = clamp(pixel.xy * f32(frame.side) / vec2f(f32(frame.width), f32(frame.height)) - 0.5,
                 vec2f(0), vec2f(f32(end)));
  let p = vec2u(xy);
  let q = min(p + 1u, vec2u(end));
  let f = fract(xy);
  let upper = p.y * frame.side;
  let lower = q.y * frame.side;
  let stride = frame.side * frame.side;
  for (var i = 0u; i < frame.count; i++) {
    let item = frame.instances[i];
    let base = item.plane * stride;
    let top = mix(logits[base + upper + p.x], logits[base + upper + q.x], f.x);
    let bottom = mix(logits[base + lower + p.x], logits[base + lower + q.x], f.x);
    if (mix(top, bottom, f.y) > 0.0) {
      let c = item.color;
      let rgb = vec3f(f32(c >> 16u), f32((c >> 8u) & 255u), f32(c & 255u)) / 255.0;
      let alpha = 0.46;
      return vec4f(rgb * alpha, alpha);
    }
  }
  return vec4f(0);
}
`;

// maskBuffer holds score-sorted f32 logits [instances, side, side] on this ORT device.
// visibleResults is a prefix in exactly that order. Caller owns each returned ImageBitmap.
export function createMaskRenderer(device) {
  const canvas = new OffscreenCanvas(1, 1);
  const context = canvas.getContext('webgpu');
  if (!context) throw new Error('Could not initialize the segmentation canvas.');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({device, format, alphaMode: 'premultiplied'});
  const module = device.createShaderModule({code: maskShader});
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {module, entryPoint: 'vs'},
    fragment: {module, entryPoint: 'fs', targets: [{format}]},
  });
  const layout = pipeline.getBindGroupLayout(0);
  let metadata;
  let words;
  return {
    draw(maskBuffer, side, visibleResults, width, height) {
      if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 ||
          width > device.limits.maxTextureDimension2D || height > device.limits.maxTextureDimension2D) {
        throw new Error('Video dimensions exceed the GPU texture limit.');
      }
      const count = visibleResults.length;
      const bytes = count * side * side * 4;
      if (count && (!Number.isInteger(side) || side < 1 || !maskBuffer ||
          bytes > maskBuffer.size || bytes > device.limits.maxStorageBufferBindingSize)) {
        throw new Error('The mask dimensions do not match the model output.');
      }
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: {r: 0, g: 0, b: 0, a: 0}, loadOp: 'clear', storeOp: 'store',
      }]});
      if (count) {
        const wordCount = 4 + 2 * count;
        if (!words || words.length < wordCount) {
          metadata?.destroy();
          words = new Uint32Array(wordCount);
          metadata = device.createBuffer({size: words.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
        }
        words[0] = width;
        words[1] = height;
        words[2] = side;
        words[3] = count;
        // Small boxes take priority in overlaps. Fetch the original mask plane by rank
        // and its color by class, independent of confidence or drawing order.
        const order = visibleResults.map((result, rank) => ({rank, area: visibleBoxArea(result.box)}));
        order.sort((a, b) => a.area - b.area || a.rank - b.rank);
        for (let i = 0; i < count; i++) {
          const {rank} = order[i];
          words[4 + 2 * i] = rank;
          words[5 + 2 * i] = packedClassColor(visibleResults[rank].label);
        }
        device.queue.writeBuffer(metadata, 0, words, 0, wordCount);
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, device.createBindGroup({layout, entries: [
          {binding: 0, resource: {buffer: metadata}},
          {binding: 1, resource: {buffer: maskBuffer, size: bytes}},
        ]}));
        pass.draw(3);
      }
      pass.end();
      device.queue.submit([encoder.finish()]);
      return canvas.transferToImageBitmap();
    },
    dispose() {
      metadata?.destroy();
      context.unconfigure();
    },
  };
}
