import {initVideoUpload} from './video-upload.js';
import {drawPredictions} from './annotations.js';

const el = id => document.getElementById(id);
const frame = el('frame');
const overlay = el('overlay');
const frameCtx = frame.getContext('2d', {alpha: false});
const ink = overlay.getContext('2d');
const button = el('toggle');
const slider = el('threshold');
const modelSize = el('model-size');
const task = el('task');
const selectedTask = () => task.querySelector('input:checked');
const modelNames = {det: 'LoopDet-S', pose: 'LoopPose-S', seg: 'LoopSeg-S'};
const idlePrompt = el('status').textContent;
let active = null;
let classes = [];

function message(text = idlePrompt, error = false) {
  el('status').textContent = text;
  el('status').classList.toggle('error', error);
}

function stop(text = idlePrompt, error = false) {
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
  for (const id of ['fps','latency','count']) el(id).textContent = '—';
  button.textContent = 'Live';
  message(text, error);
}

async function nextFrame(run) {
  try {
    const {done, value: frame} = await run.reader.read();
    if (active !== run) { frame?.close(); return; }
    if (done) { stop(); return; }
    try {
      run.worker.postMessage({type: 'frame', frame, threshold: Number(slider.value)}, [frame]);
    } catch (error) {
      frame.close();
      throw error;
    }
  } catch (error) {
    if (active === run) stop('Could not read the camera frame. ' + error.message, true);
  }
}

function receive(run, data) {
  if (active !== run) { data.frame?.close(); data.maskOverlay?.close(); return; }
  if (data.type === 'error') { stop('Inference failed. ' + data.message, true); return; }
  if (data.type === 'ready') {
    el('precision').textContent = ' · ' + data.precision.toUpperCase();
    message('Preparing the first prediction…');
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
    ink.clearRect(0, 0, overlay.width, overlay.height);
    drawPredictions(ink, classes, run.task, data.results, data.maskOverlay);
    el('count').textContent = String(data.results.length);
  } catch (error) {
    stop('Could not display the frame. ' + error.message, true);
    return;
  } finally {
    videoFrame.close();
    data.maskOverlay?.close();
  }
  el('screen').hidden = false;
  el('idle').hidden = true;
  el('latency').textContent = Math.round(data.ms);
  if (run.fpsTimer == null) {
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
  upload.clear();
  const run = {task: selectedTask().value, size: modelSize.value};
  active = run;
  button.textContent = 'Stop live';
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Open this demo over HTTPS or localhost.');
    if (!navigator.gpu || !window.VideoFrame || !window.MediaStreamTrackProcessor) throw new Error('Use desktop Chrome or Edge with WebGPU enabled.');
    message('Waiting for camera permission…');
    const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: {width: {ideal: 960}, height: {ideal: 540}}});
    if (active !== run) { stream.getTracks().forEach(track => track.stop()); return; }
    run.stream = stream;
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error('The camera did not provide a video track.');
    track.onended = () => { if (active === run) stop(); };
    run.reader = new MediaStreamTrackProcessor({track, maxBufferSize: 1}).readable.getReader();
    message('Loading ' + modelNames[run.task] + ' and the WebGPU runtime…');
    if (!classes.length) {
      const response = await fetch('./classes.json');
      if (!response.ok) throw new Error('Could not load the class labels.');
      classes = await response.json();
    }
    if (active !== run) return;
    const workerURL = new URL('./detector.js', import.meta.url);
    workerURL.searchParams.set('size', run.size);
    workerURL.searchParams.set('task', run.task);
    run.worker = new Worker(workerURL, {type: 'module'});
    run.worker.onmessage = ({data}) => receive(run, data);
    run.worker.onerror = event => { if (active === run) stop('Could not load the inference worker. ' + event.message, true); };
    run.worker.postMessage({type: 'load'});
  } catch (error) {
    if (active !== run) return;
    const reason = {NotAllowedError:'Allow camera access in your browser and try again.',NotFoundError:'No webcam found. Connect a camera and try again.',NotReadableError:'The webcam is unavailable. Check whether another app is using it.'};
    stop(reason[error.name] || error.message, true);
  }
}

slider.oninput = () => {
  el('level').textContent = Number(slider.value).toFixed(2);
};
const upload = initVideoUpload({stopCamera: stop, message, getTask: () => selectedTask().value});
function stopLiveOnChange() {
  if (active) stop();
}
modelSize.addEventListener('change', stopLiveOnChange);
task.addEventListener('change', () => {
  stopLiveOnChange();
  el('task-title').textContent = selectedTask().closest('label').querySelector('.task-name').textContent;
  upload.showTask();
});
button.onclick = () => active ? stop() : start();
window.addEventListener('pagehide', () => { upload.clear(); stop(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && active) stop(); });
