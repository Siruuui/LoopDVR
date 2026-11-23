import {classColor, drawPose} from './overlays.js?v=5';

const el = id => document.getElementById(id);
const frame = el('frame');
const overlay = el('overlay');
const frameCtx = frame.getContext('2d', {alpha: false});
const ink = overlay.getContext('2d');
const button = el('toggle');
const slider = el('threshold');
const modelSize = el('model-size');
const task = el('task');
const modelNames = {det: 'LoopDet-S', pose: 'LoopPose-S', seg: 'LoopSeg-S'};
let active = null;
let classes = [];

function message(text, error = false) {
  el('status').textContent = text;
  el('status').classList.toggle('error', error);
}

function stop(text = '摄像头已关闭', error = false) {
  const run = active;
  active = null;
  clearInterval(run?.fpsTimer);
  if (run?.reader) {
    const reader = run.reader;
    reader.cancel().catch(() => {}).finally(() => reader.releaseLock());
  }
  run?.worker?.terminate();
  run?.stream?.getTracks().forEach(track => track.stop());
  el('precision').textContent = '';
  frameCtx.clearRect(0, 0, frame.width, frame.height);
  ink.clearRect(0, 0, overlay.width, overlay.height);
  el('screen').hidden = true;
  el('idle').hidden = false;
  el('lamp').classList.remove('live');
  for (const id of ['fps','latency','count']) el(id).textContent = '—';
  task.disabled = modelSize.disabled = false;
  button.textContent = '开启摄像头';
  message(text, error);
}

function drawPredictions(mode, results, maskOverlay) {
  const {width: w, height: h} = overlay;
  ink.clearRect(0, 0, w, h);
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
  el('count').textContent = String(results.length);
}

async function nextFrame(run) {
  try {
    const {done, value: frame} = await run.reader.read();
    if (active !== run) { frame?.close(); return; }
    if (done) { stop('摄像头连接已结束'); return; }
    try {
      run.worker.postMessage({type: 'frame', frame, threshold: Number(slider.value)}, [frame]);
    } catch (error) {
      frame.close();
      throw error;
    }
  } catch (error) {
    if (active === run) stop('读取摄像头画面失败：' + error.message, true);
  }
}

function receive(run, data) {
  if (active !== run) { data.frame?.close(); data.maskOverlay?.close(); return; }
  if (data.type === 'error') { stop('检测启动或运行失败：' + data.message, true); return; }
  if (data.type === 'ready') {
    el('precision').textContent = ' · ' + data.precision.toUpperCase();
    message('正在处理首帧并编译 GPU 着色器…');
    nextFrame(run);
    return;
  }
  if (data.type !== 'frame') return;
  nextFrame(run);
  const videoFrame = data.frame;
  if (frame.width !== videoFrame.displayWidth || frame.height !== videoFrame.displayHeight) {
    frame.width = overlay.width = videoFrame.displayWidth;
    frame.height = overlay.height = videoFrame.displayHeight;
  }
  try {
    frameCtx.drawImage(videoFrame, 0, 0);
    drawPredictions(run.task, data.results, data.maskOverlay);
  } catch (error) {
    stop('显示摄像头画面失败：' + error.message, true);
    return;
  } finally {
    videoFrame.close();
    data.maskOverlay?.close();
  }
  el('screen').hidden = false;
  el('idle').hidden = true;
  el('lamp').classList.add('live');
  el('latency').textContent = Math.round(data.ms);
  if (run.fpsTimer == null) {
    message('摄像头画面仅在本机处理 · 停止后可切换任务和输入尺寸');
    let since = performance.now();
    run.completed = 0;
    run.fpsTimer = setInterval(() => {
      const now = performance.now();
      el('fps').textContent = (run.completed * 1000 / (now - since)).toFixed(1);
      since = now;
      run.completed = 0;
    }, 1000);
  } else {
    run.completed++;
  }
}

async function start() {
  const run = {task: task.value};
  active = run;
  task.disabled = modelSize.disabled = true;
  button.textContent = '关闭摄像头';
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('请使用 localhost 或 HTTPS 打开页面。');
    if (!navigator.gpu || !window.MediaStreamTrackProcessor) throw new Error('请使用支持 WebGPU 的桌面 Chrome 或 Edge。');
    message('等待摄像头授权…');
    const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: {width: {ideal: 960}, height: {ideal: 540}}});
    if (active !== run) { stream.getTracks().forEach(track => track.stop()); return; }
    run.stream = stream;
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error('摄像头未提供视频轨。');
    track.onended = () => { if (active === run) stop('摄像头连接已结束'); };
    run.reader = new MediaStreamTrackProcessor({track, maxBufferSize: 1}).readable.getReader();
    message('正在加载 ' + modelNames[run.task] + ' 和 WebGPU 运行时…');
    if (!classes.length) {
      const response = await fetch('./classes.json');
      if (!response.ok) throw new Error('类别表加载失败');
      classes = await response.json();
    }
    if (active !== run) return;
    const workerURL = new URL('./detector.js?v=6', import.meta.url);
    workerURL.searchParams.set('size', modelSize.value);
    workerURL.searchParams.set('task', run.task);
    run.worker = new Worker(workerURL, {type: 'module'});
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
};
task.onchange = () => {
  el('model-name').textContent = modelNames[task.value];
  el('task-title').textContent = task.selectedOptions[0].textContent;
};
task.onchange();
button.onclick = () => active ? stop() : start();
window.addEventListener('pagehide', () => stop());
document.addEventListener('visibilitychange', () => { if (document.hidden && active) stop('页面已转入后台，摄像头已关闭'); });
