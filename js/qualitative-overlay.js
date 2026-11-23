// Frame rendering and 720p coordinates from the supplied Case 3 visualization.
const qualitativeOverlay = (() => {
  'use strict';
  const clip = {
    width: 1280,
    height: 720,
    fps: 30,
    frameCount: 773,
    colors: {
      "person": "#ffd64d",
      "backpack": "#ff41dc",
      "baseball bat": "#fa3f2e",
      "bench": "#b2774d",
      "bicycle": "#fa536b",
      "bottle": "#6994bf",
      "bus": "#60d366",
      "car": "#4b92ff",
      "cell phone": "#cf599e",
      "chair": "#e6a8c7",
      "cup": "#70922a",
      "dining table": "#bcf906",
      "fire hydrant": "#e406f9",
      "handbag": "#28d7f5",
      "motorcycle": "#a578ff",
      "potted plant": "#cbddb0",
      "sports ball": "#06f906",
      "traffic light": "#429a75",
      "truck": "#ff843e",
      "umbrella": "#06f9d0"
    }
  };
  const skeleton = [[15, 13], [13, 11], [16, 14], [14, 12], [11, 12], [5, 11], [6, 12], [5, 6], [5, 7], [6, 8], [7, 9], [8, 10], [1, 2], [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6]];

  // COCO compressed RLE is column-major, with a background run first.
  // Emit at most three rectangles per foreground run, including runs crossing columns.
  function maskRects({x, y, w, h, counts}, rect) {
    let at = 0, pixel = 0, run = 0;
    const history = [0, 0];
    while (at < counts.length) {
      let length = 0, shift = 0, code;
      do {
        if (at >= counts.length) throw new Error('Incomplete mask run');
        code = counts.charCodeAt(at++) - 48;
        if (code < 0 || code > 63 || shift > 25) throw new Error('Invalid mask encoding');
        length |= (code & 31) << shift;
        shift += 5;
      } while (code & 32);
      if (code & 16) length |= -1 << shift;
      if (run > 2) length += history[run % 2];
      history[run % 2] = length;
      if (length < 0 || pixel + length > w * h) throw new Error('Mask exceeds its bounds');
      if ((run & 1) && length) {
        let col = Math.floor(pixel / h), row = pixel % h, remaining = length;
        if (row) {
          const tail = Math.min(h - row, remaining);
          rect(x + col, y + row, 1, tail);
          remaining -= tail;
          col++;
        }
        const whole = Math.floor(remaining / h);
        if (whole) {
          rect(x + col, y, whole, h);
          col += whole;
          remaining -= whole * h;
        }
        if (remaining) rect(x + col, y, 1, remaining);
      }
      pixel += length;
      run++;
    }
    if (pixel !== w * h) throw new Error('Mask length does not match its dimensions');
  }

  // RLE rectangles may share all or part of an edge. Only intervals covered
  // an odd number of times are on the mask boundary, including holes.
  function maskPaths(mask) {
    const fill = new Path2D(), outline = new Path2D();
    const horizontal = new Map(), vertical = new Map();
    function edge(lines, at, start, end) {
      const endpoints = lines.get(at);
      if (endpoints) endpoints.push(start, end);
      else lines.set(at, [start, end]);
    }
    maskRects(mask, (x, y, w, h) => {
      fill.rect(x, y, w, h);
      edge(horizontal, y, x, x + w);
      edge(horizontal, y + h, x, x + w);
      edge(vertical, x, y, y + h);
      edge(vertical, x + w, y, y + h);
    });
    function trace(lines, horizontalLine) {
      for (const [at, endpoints] of lines) {
        endpoints.sort((a, b) => a - b);
        let start = null;
        for (let i = 0; i < endpoints.length;) {
          const value = endpoints[i], first = i++;
          while (i < endpoints.length && endpoints[i] === value) i++;
          if ((i - first) % 2 === 0) continue;
          if (start === null) { start = value; continue; }
          if (horizontalLine) {
            outline.moveTo(start, at); outline.lineTo(value, at);
          } else {
            outline.moveTo(at, start); outline.lineTo(at, value);
          }
          start = null;
        }
      }
    }
    trace(horizontal, true);
    trace(vertical, false);
    return {fill, outline};
  }

  function drawCaptions(ctx, labels, width, height) {
    const occupied = [], h = 26;
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textBaseline = 'top';
    for (const [text, color, ax, ay] of labels) {
      const w = Math.ceil(ctx.measureText(text).width) + 10;
      const x0 = Math.min(width - w, Math.max(0, Math.round(ax)));
      const y0 = Math.min(height - h, Math.max(0, Math.round(ay) - h));
      let found;
      for (let k = 0; !found && k <= Math.ceil(height / h); k++) {
        for (const dy of k ? [-k, k] : [0]) {
          const y = Math.min(height - h, Math.max(0, y0 + dy * (h + 1)));
          for (const dx of [0, -w, w]) {
            const x = Math.min(width - w, Math.max(0, x0 + dx));
            if (!occupied.some(b => x < b[2] && x + w > b[0] && y < b[3] && y + h > b[1])) {
              found = [x, y]; break;
            }
          }
          if (found) break;
        }
      }
      const [x, y] = found || [x0, y0];
      occupied.push([x, y, x + w, y + h]);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#1c1814';
      ctx.fillText(text, x + 5, y + 2);
    }
  }

  function drawFrame(ctx, clip, skeleton, layer, index) {
    ctx.clearRect(0, 0, clip.width, clip.height);
    if (!layer || !layer.frames[index]) return;
    const captions = [], masks = [], boxes = [];
    ctx.save();
    ctx.lineJoin = ctx.lineCap = 'round';
    for (const o of layer.frames[index]) {
      const color = clip.colors[o.label];
      const [x1, y1, x2, y2] = o.box;
      const small = Math.max(x2 - x1, y2 - y1) < 100 * clip.height / 1080;
      if (layer.task === 'pose') {
        const points = o.keypoints;
        ctx.lineWidth = small ? 0.8 : 2.7;
        for (const [a, b] of skeleton) {
          ctx.beginPath(); ctx.moveTo(...points[a]); ctx.lineTo(...points[b]);
          ctx.strokeStyle = a <= 6 ? '#fce652' : '#86f56e';
          ctx.stroke();
        }
        ctx.fillStyle = '#ff781e';
        for (const [x, y] of points) {
          ctx.beginPath(); ctx.arc(x, y, small ? 0.85 : 2.65, 0, Math.PI * 2); ctx.fill();
        }
        captions.push([o.label, color, points[0][0], Math.min(...points.map(p => p[1]))]);
      } else {
        if (o.mask) {
          masks.push({ ...maskPaths(o.mask), color });
        }
        boxes.push([x1, y1, x2 - x1, y2 - y1, color, small ? 1.35 : 2]);
        captions.push([o.label, color, x1, y1]);
      }
    }
    // The inner half of each 8px stroke is removed by the fills below.
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 8;
    for (const mask of masks) ctx.stroke(mask.outline);
    for (const {fill, color} of masks) {
      // Erase underlying tints and strokes before drawing this instance once.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill(fill);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.43;
      ctx.fill(fill);
      ctx.globalAlpha = 1;
    }
    for (const [x, y, w, h, color, width] of boxes) {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, w, h);
    }
    drawCaptions(ctx, captions, clip.width, clip.height);
    ctx.restore();
  }



  // Each task is the single, script-loadable data export supplied with the clip.
  // This also lets a downloaded copy of the project page open directly from disk.
  const layers = new Map();
  function load(task) {
    if (layers.has(task)) return layers.get(task);
    const pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/videos/case3/' + task + '.js';
      script.onload = () => {
        const data = script.loopLayer;
        script.remove();
        if (data?.task === task && data.width === clip.width && data.height === clip.height &&
            data.fps === clip.fps && data.frames?.length === clip.frameCount && data.frameCount === clip.frameCount) {
          resolve(data);
        } else {
          reject(new Error('The annotation layer does not match the video.'));
        }
      };
      script.onerror = () => {
        script.remove();
        reject(new Error('Could not load the video annotations.'));
      };
      document.head.append(script);
    }).catch(error => {
      layers.delete(task);
      throw error;
    });
    layers.set(task, pending);
    return pending;
  }

  function attach(video, canvas) {
    canvas.width = clip.width;
    canvas.height = clip.height;
    const ctx = canvas.getContext('2d');
    let layer = null;
    let lastFrame = null;
    let shown = -1;
    const clockFrame = () => Math.floor(video.currentTime * clip.fps + 0.000001);
    function paint(frame) {
      const index = Math.min(clip.frameCount - 1, Math.max(0, frame));
      if (index === shown) return;
      drawFrame(ctx, clip, skeleton, layer, index);
      shown = index;
    }
    if (video.requestVideoFrameCallback) {
      function frame(_, metadata) {
        lastFrame = Math.round(metadata.mediaTime * clip.fps);
        paint(lastFrame);
        video.requestVideoFrameCallback(frame);
      }
      video.requestVideoFrameCallback(frame);
    } else {
      let tick = 0;
      function animate() {
        paint(clockFrame());
        tick = video.paused || video.ended ? 0 : requestAnimationFrame(animate);
      }
      video.addEventListener('playing', () => { if (!tick) animate(); });
    }
    function refresh() {
      lastFrame = null;
      paint(clockFrame());
    }
    video.addEventListener('seeked', refresh);
    video.addEventListener('loadeddata', refresh);
    return data => {
      layer = data;
      shown = -1;
      paint(lastFrame ?? clockFrame());
    };
  }

  return { load, attach };
})();
