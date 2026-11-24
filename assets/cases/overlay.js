// RLE decoding and mask boundaries adapted from the LoopDVR Case 3 video overlay.
// COCO compressed RLE is column-major, with a background run first.
// Emit at most three rectangles per foreground run, including runs crossing columns.
function maskRects({x, y, w, h, counts}, rect) {
  let at = 0, pixel = 0, run = 0;
  const history = [0, 0];
  while (at < counts.length) {
    let length = 0, shift = 0, code;
    do {
      if (at >= counts.length) throw new Error('掩膜游程不完整');
      code = counts.charCodeAt(at++) - 48;
      if (code < 0 || code > 63 || shift > 25) throw new Error('掩膜编码无效');
      length |= (code & 31) << shift;
      shift += 5;
    } while (code & 32);
    if (code & 16) length |= -1 << shift;
    if (run > 2) length += history[run % 2];
    history[run % 2] = length;
    if (length < 0 || pixel + length > w * h) throw new Error('掩膜尺寸不符');
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
  if (pixel !== w * h) throw new Error('掩膜长度不符');
}

// RLE rectangles may share all or part of an edge. Only intervals covered
// an odd number of times are on the mask boundary, including holes.
function maskPaths(mask, sx, sy, x0, y0) {
  const fill = new Path2D(), outline = new Path2D();
  const horizontal = new Map(), vertical = new Map();
  let area = 0, left = Infinity, top = Infinity;
  function edge(lines, at, start, end) {
    const endpoints = lines.get(at);
    if (endpoints) endpoints.push(start, end);
    else lines.set(at, [start, end]);
  }
  maskRects(mask, (x, y, w, h) => {
    area += w * h;
    left = Math.min(left, x);
    top = Math.min(top, y);
    fill.rect((x - x0) * sx, (y - y0) * sy, w * sx, h * sy);
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
          outline.moveTo((start - x0) * sx, (at - y0) * sy);
          outline.lineTo((value - x0) * sx, (at - y0) * sy);
        } else {
          outline.moveTo((at - x0) * sx, (start - y0) * sy);
          outline.lineTo((at - x0) * sx, (value - y0) * sy);
        }
        start = null;
      }
    }
  }
  trace(horizontal, true);
  trace(vertical, false);
  return {fill, outline, area, left, top};
}

function drawCaption(ctx, text, color, ax, ay, width, height, unit, occupied, centered = false) {
  const padding = 2 * unit;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width + 2 * padding);
  const h = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 2 * padding);
  const clamp = (value, limit) => Math.max(0, Math.min(limit, Math.round(value)));
  const x = clamp(ax - (centered ? w / 2 : 0), width - w);
  const y0 = clamp(ay - h, height - h);
  let bestY = y0;
  let bestOverlap = Infinity;
  for (const offset of [0, 1, -1, 2, -2, 3]) {
    const y = clamp(y0 + offset * h, height - h);
    const overlap = occupied.reduce((sum, [a, b, c, d]) => sum +
      Math.max(0, Math.min(x + w, c) - Math.max(x, a)) *
      Math.max(0, Math.min(y + h, d) - Math.max(y, b)), 0);
    if (overlap < bestOverlap) {
      bestY = y;
      bestOverlap = overlap;
      if (overlap === 0) break;
    }
  }
  ctx.fillStyle = color;
  ctx.fillRect(x, bestY, w, h);
  const channels = color.slice(1).match(/../g).map(channel => parseInt(channel, 16));
  const [r, g, b] = channels;
  ctx.fillStyle = .2126 * r + .7152 * g + .0722 * b > 140 ? '#102030' : '#fff';
  ctx.fillText(text, x + padding, bestY + padding + metrics.actualBoundingBoxAscent);
  occupied.push([x, bestY, x + w, bestY + h]);
}

function drawOverlay(canvas, layout, transform, predictions, task) {
  const ctx = canvas.getContext('2d');
  const {width, height} = canvas;
  ctx.clearRect(0, 0, width, height);
  if (task === 'original') return;

  const [x0, y0, x1, y1] = transform.crop;
  const sx = width / (x1 - x0);
  const sy = height / (y1 - y0);
  const unit = width / 640;
  const x = value => (value - x0) * sx;
  const y = value => (value - y0) * sy;
  const colorOf = record => layout.category_colors[record.category_id];
  const captions = [];
  const categoryCaption = (record, ax, ay) => captions.push([
    layout.category_names[record.category_id] + ' ' + record.score.toFixed(2),
    colorOf(record), x(ax), y(ay),
  ]);

  ctx.save();
  ctx.lineJoin = ctx.lineCap = 'round';
  if (task === 'det') {
    ctx.lineWidth = layout.det_line_width_at_640 * unit;
    for (const record of predictions.det) {
      const [left, top, right, bottom] = record.box_xyxy;
      ctx.strokeStyle = colorOf(record);
      ctx.strokeRect(x(left), y(top), (right - left) * sx, (bottom - top) * sy);
      categoryCaption(record, left, top);
    }
  } else if (task === 'seg') {
    const masks = predictions.seg.map(record => {
      const [h, w] = record.segmentation.size;
      const mask = maskPaths({x: 0, y: 0, w, h, counts: record.segmentation.counts}, sx, sy, x0, y0);
      categoryCaption(record, mask.left, mask.top);
      return {...mask, color: colorOf(record)};
    }).sort((a, b) => b.area - a.area);
    ctx.globalAlpha = layout.mask_opacity;
    for (const mask of masks) {
      ctx.fillStyle = mask.color;
      ctx.fill(mask.fill);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = layout.mask_white_line_width_at_640 * unit;
    for (const mask of masks) ctx.stroke(mask.outline);
  } else if (task === 'pose') {
    const center = new Set(layout.pose_center_edges.map(edge => edge.join(',')));
    const people = predictions.pose.map(record => ({
      score: record.score,
      points: layout.keypoint_names.map((_, i) => [x(record.keypoints[i * 3]), y(record.keypoints[i * 3 + 1])]),
    }));
    ctx.lineWidth = layout.pose_line_width_at_640 * unit;
    for (const {points} of people) {
      for (const [a, b] of layout.skeleton) {
        const side = center.has([a, b].sort((i, j) => i - j).join(',')) ?
          'center' : (a || b) % 2 ? 'left' : 'right';
        ctx.strokeStyle = layout.pose_colors[side];
        ctx.beginPath();
        ctx.moveTo(...points[a]);
        ctx.lineTo(...points[b]);
        ctx.stroke();
      }
    }
    ctx.fillStyle = layout.pose_node_fill;
    ctx.strokeStyle = layout.pose_node_outline;
    ctx.lineWidth = .8 * unit;
    for (const {points, score} of people) {
      for (const [px, py] of points) {
        ctx.beginPath();
        ctx.arc(px, py, 2.3 * unit, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
      const face = points.slice(0, 5);
      captions.push([
        score.toFixed(2), layout.pose_label_color,
        face.reduce((sum, [px]) => sum + px, 0) / face.length,
        Math.min(...face.map(([, py]) => py)) - 4 * unit, true,
      ]);
    }
  }
  ctx.font = 'bold ' + layout.label_font_size_at_640 * unit + 'px Arial, sans-serif';
  const occupied = [];
  for (const [text, color, ax, ay, centered] of captions) {
    drawCaption(ctx, text, color, ax, ay, width, height, unit, occupied, centered);
  }
  ctx.restore();
}
