import {classColor, drawPose} from './overlays.js';

export function drawPredictions(ink, classes, mode, results, maskOverlay) {
  const {width: w, height: h} = ink.canvas;
  if (maskOverlay) ink.drawImage(maskOverlay, 0, 0, w, h);
  const unit = Math.max(1, Math.min(w, h) / 500);
  ink.font = '600 ' + Math.round(14 * unit) + 'px system-ui, sans-serif';
  ink.textBaseline = 'middle';
  ink.lineWidth = 2 * unit;
  for (const result of results) {
    const {box, score, label} = result;
    const [x, y, right, bottom] = box.map((n, i) => Math.max(0, Math.min(1, n)) * (i % 2 ? h : w));
    const color = classColor(label);
    if (mode === 'pose') {
      drawPose(ink, result, w, h, unit);
    } else {
      ink.strokeStyle = color;
      ink.strokeRect(x, y, right - x, bottom - y);
    }
    const text = classes[label] + ' ' + Math.round(score * 100) + '%';
    const tagW = ink.measureText(text).width + 10 * unit;
    const tagH = 20 * unit;
    const tagX = Math.max(0, Math.min(w - tagW, x));
    const tagY = Math.min(h - tagH, Math.max(0, y - tagH));
    ink.fillStyle = color;
    ink.fillRect(tagX, tagY, tagW, tagH);
    ink.fillStyle = '#101a14';
    ink.fillText(text, tagX + 5 * unit, tagY + tagH / 2);
  }
}
