const el = id => document.getElementById(id);
const video = el('source');
const frame = el('frame');
const overlay = el('overlay');
const frameCtx = frame.getContext('2d', {alpha: false});
const ink = overlay.getContext('2d');
const button = el('toggle');
const slider = el('threshold');
let active = null;
let results = [];
let classes = [];
let timestamps = [];

function message(text, error = false) {
  el('status').textContent = text;
  el('status').classList.toggle('error', error);
}

function stop(text = '摄像头已关闭', error = false) {
  const run = active;
  active = null;
  if (run?.callback != null) video.cancelVideoFrameCallback(run.callback);
  run?.worker?.terminate();
  run?.stream?.getTracks().forEach(track => track.stop());
  video.pause();
  video.srcObject = null;
  results = [];
  timestamps = [];
  frameCtx.clearRect(0, 0, frame.width, frame.height);
  ink.clearRect(0, 0, overlay.width, overlay.height);
  el('screen').hidden = true;
  el('idle').hidden = false;
  el('lamp').classList.remove('live');
  for (const id of ['fps','latency','count']) el(id).textContent = '—';
  button.textContent = '开启摄像头';
  message(text, error);
}

function showBoxes() {
  const {width: w, height: h} = overlay;
  const threshold = Number(slider.value);
  const visible = results.filter(r => r.score >= threshold);
  ink.clearRect(0, 0, w, h);
  const unit = Math.max(1, Math.min(w, h) / 500);
  ink.font = '600 ' + Math.round(14 * unit) + 'px system-ui, sans-serif';
  ink.textBaseline = 'middle';
  ink.lineWidth = 2 * unit;
  for (const {box, score, label} of visible) {
    const [x, y, right, bottom] = box.map((n, i) => Math.max(0, Math.min(1, n)) * (i % 2 ? h : w));
    const color = 'hsl(' + ((label * 47 + 83) % 360) + ' 92% 70%)';
    ink.strokeStyle = color;
    ink.strokeRect(x, y, right - x, bottom - y);
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
  el('count').textContent = String(visible.length);
}

function nextFrame(run) {
  run.callback = video.requestVideoFrameCallback(async () => {
    run.callback = null;
    if (active !== run) return;
    try {
      const bitmap = await createImageBitmap(video);
      if (active !== run) { bitmap.close(); return; }
      run.worker.postMessage({type: 'frame', bitmap}, [bitmap]);
    } catch (error) {
      if (active === run) stop('读取摄像头画面失败：' + error.message, true);
    }
  });
}

function receive(run, data) {
  if (active !== run) { data.bitmap?.close(); return; }
  if (data.type === 'error') { stop('检测启动或运行失败：' + data.message, true); return; }
  if (data.type === 'ready') {
    message('正在处理首帧并编译 GPU 着色器…');
    nextFrame(run);
    return;
  }
  if (data.type !== 'frame') return;
  const {bitmap} = data;
  if (frame.width !== bitmap.width || frame.height !== bitmap.height) {
    frame.width = overlay.width = bitmap.width;
    frame.height = overlay.height = bitmap.height;
  }
  frameCtx.drawImage(bitmap, 0, 0);
  bitmap.close();
  results = data.results;
  showBoxes();
  el('screen').hidden = false;
  el('idle').hidden = true;
  el('lamp').classList.add('live');
  const now = performance.now();
  timestamps.push(now);
  if (timestamps.length > 12) timestamps.shift();
  if (timestamps.length > 1) el('fps').textContent = ((timestamps.length-1)*1000/(now-timestamps[0])).toFixed(1);
  el('latency').textContent = Math.round(data.ms);
  if (timestamps.length === 1) message('正在检测 · 摄像头画面仅在本机处理');
  nextFrame(run);
}

async function start() {
  const run = {};
  active = run;
  button.textContent = '停止检测';
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('请使用 localhost 或 HTTPS 打开页面。');
    if (!navigator.gpu || !video.requestVideoFrameCallback) throw new Error('请使用支持 WebGPU 的桌面 Chrome 或 Edge。');
    message('等待摄像头授权…');
    const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: {width: {ideal: 960}, height: {ideal: 540}}});
    if (active !== run) { stream.getTracks().forEach(track => track.stop()); return; }
    run.stream = stream;
    stream.getVideoTracks()[0].onended = () => { if (active === run) stop('摄像头连接已结束'); };
    video.srcObject = stream;
    await video.play();
    if (active !== run) return;
    message('正在加载 LoopDet-S 和 WebGPU 运行时…');
    if (!classes.length) {
      const response = await fetch('./classes.json');
      if (!response.ok) throw new Error('类别表加载失败');
      classes = await response.json();
    }
    if (active !== run) return;
    run.worker = new Worker(new URL('./detector.js', import.meta.url), {type: 'module'});
    run.worker.onmessage = ({data}) => receive(run, data);
    run.worker.onerror = event => { if (active === run) stop('推理模块加载失败：' + event.message, true); };
    run.worker.postMessage({type: 'load'});
  } catch (error) {
    if (active !== run) return;
    const reason = {NotAllowedError:'摄像头权限未授予，可在地址栏更改权限后重试。',NotFoundError:'未找到摄像头，请连接设备后重试。',NotReadableError:'摄像头无法读取，请检查是否被其他应用占用。'};
    stop(reason[error.name] || error.message, true);
  }
}

slider.oninput = () => {
  el('level').textContent = Number(slider.value).toFixed(2);
  if (!el('screen').hidden) showBoxes();
};
button.onclick = () => active ? stop() : start();
window.addEventListener('pagehide', () => stop());
document.addEventListener('visibilitychange', () => { if (document.hidden && active) stop('页面已转入后台，摄像头已关闭'); });
