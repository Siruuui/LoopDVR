import {initVideoUpload} from './video-upload.js?v=704';
import {drawPredictions} from './annotations.js';

const el = id => document.getElementById(id);
const frame = el('frame');
const overlay = el('overlay');
const frameCtx = frame.getContext('2d', {alpha: false});
const ink = overlay.getContext('2d');
const button = el('toggle');
const flip = el('flip-camera');
const viewer = el('viewer');
const slider = el('threshold');
const modelSize = el('model-size');
const task = el('task');
const selectedTask = () => task.querySelector('input:checked');
const modelNames = {det: 'LoopDet-S', pose: 'LoopPose-S', seg: 'LoopSeg-S'};
const idlePrompt = el('status').textContent;
let active = null;
let classes = [];

function message(text = idlePrompt, state = 'idle') {
  el('status').textContent = text;
  el('status').classList.toggle('error', state === 'error');
  el('idle').classList.toggle('loading', state === 'loading');
}

function releaseCamera(run) {
  if (run.video) {
    if (run.frameCallback != null) run.video.cancelVideoFrameCallback(run.frameCallback);
    run.video.pause();
    run.video.srcObject = null;
    run.video = null;
  }
  run.stream?.getTracks().forEach(track => track.stop());
  run.stream = null;
}

function stop(text = idlePrompt, error = false) {
  const run = active;
  active = null;
  clearInterval(run?.fpsTimer);
  if (run) releaseCamera(run);
  run?.worker?.terminate();
  flip.hidden = true;
  viewer.classList.remove('camera-view');
  viewer.style.removeProperty('--camera-ratio');
  el('precision').textContent = '';
  frameCtx.clearRect(0, 0, frame.width, frame.height);
  ink.clearRect(0, 0, overlay.width, overlay.height);
  el('screen').hidden = true;
  el('idle').hidden = false;
  for (const id of ['fps','latency','count']) el(id).textContent = '—';
  button.textContent = 'Live';
  message(text, error ? 'error' : 'idle');
}

function sizeViewer(width, height) {
  if (!width || !height) return;
  viewer.style.setProperty('--camera-ratio', width / height);
  viewer.classList.add('camera-view');
}

function captureFrames(run) {
  const capture = () => {
    if (active !== run) return;
    run.frameCallback = run.video.requestVideoFrameCallback(capture);
    if (run.pendingVideo) return;
    let videoFrame;
    try {
      videoFrame = new VideoFrame(run.video);
      run.worker.postMessage({type: 'frame', frame: videoFrame, threshold: Number(slider.value)}, [videoFrame]);
      run.pendingVideo = run.video;
    } catch (error) {
      videoFrame?.close();
      stop('Could not read the camera frame. ' + error.message, true);
    }
  };
  run.frameCallback = run.video.requestVideoFrameCallback(capture);
}

function receive(run, data) {
  if (active !== run) { data.frame?.close(); data.maskOverlay?.close(); return; }
  if (data.type === 'error') { stop('Inference failed. ' + data.message, true); return; }
  if (data.type === 'ready') {
    el('precision').textContent = ' · ' + data.precision.toUpperCase();
    message('Preparing the first prediction…', 'loading');
    captureFrames(run);
    return;
  }
  if (data.type !== 'frame') return;
  const source = run.pendingVideo;
  run.pendingVideo = null;
  if (source !== run.video) {
    data.frame.close();
    data.maskOverlay?.close();
    return;
  }
  const videoFrame = data.frame;
  if (frame.width !== videoFrame.displayWidth || frame.height !== videoFrame.displayHeight) {
    sizeViewer(videoFrame.displayWidth, videoFrame.displayHeight);
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
  flip.hidden = !run.canFlip;
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

async function openCamera(run, facingMode) {
  const constraints = {width: {ideal: 960}, height: {ideal: 540}};
  if (facingMode) constraints.facingMode = {exact: facingMode};
  const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: constraints});
  if (active !== run) { stream.getTracks().forEach(track => track.stop()); return; }
  run.stream = stream;
  const track = stream.getVideoTracks()[0];
  if (!track) throw new Error('The camera did not provide a video track.');
  track.onended = () => { if (active === run && run.stream === stream) stop(); };
  run.facing = track.getSettings().facingMode;
  const video = document.createElement('video');
  run.video = video;
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await video.play();
  if (active !== run) return;
  sizeViewer(video.videoWidth, video.videoHeight);
  run.canFlip = false;
  if (run.facing === 'user' || run.facing === 'environment') {
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    run.canFlip = devices.filter(device => device.kind === 'videoinput').length > 1;
  }
}

flip.onclick = async () => {
  const run = active;
  if (!run?.canFlip || flip.hidden) return;
  flip.hidden = true;
  el('screen').hidden = true;
  el('idle').hidden = false;
  message('Switching camera…', 'loading');
  const facing = run.facing === 'user' ? 'environment' : 'user';
  releaseCamera(run);
  try {
    await openCamera(run, facing);
    if (active === run) captureFrames(run);
  } catch (error) {
    if (active === run) stop('Could not switch cameras. ' + error.message, true);
  }
};

async function start() {
  upload.clear();
  const run = {task: selectedTask().value, size: modelSize.value};
  active = run;
  button.textContent = 'Stop live';
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Open this demo over HTTPS or localhost.');
    if (!navigator.gpu) throw new Error('This browser does not provide WebGPU. On iPhone, use Safari on iOS 26 or later.');
    if (!window.VideoFrame || !HTMLVideoElement.prototype.requestVideoFrameCallback) throw new Error('This browser cannot read live video frames. Update your browser to use Live.');
    message('Waiting for camera permission…');
    await openCamera(run);
    if (active !== run) return;
    message('Loading ' + modelNames[run.task] + ' and the WebGPU runtime…', 'loading');
    if (!classes.length) {
      const response = await fetch('./classes.json');
      if (!response.ok) throw new Error('Could not load the class labels.');
      classes = await response.json();
    }
    if (active !== run) return;
    const workerURL = new URL('./detector.js?v=704', import.meta.url);
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
function updateTaskTitle() {
  el('task-title').textContent = selectedTask().closest('label').querySelector('.task-name').textContent;
}
const upload = initVideoUpload({stopCamera: stop, message, getTask: () => selectedTask().value, selectTask(value) {
  task.querySelector(`input[value="${value}"]`).checked = true;
  updateTaskTitle();
}});
function stopLiveOnChange() {
  if (active) stop();
}
modelSize.addEventListener('change', stopLiveOnChange);
task.addEventListener('change', () => {
  stopLiveOnChange();
  updateTaskTitle();
  upload.onTaskChange();
});
button.onclick = () => active ? stop() : start();
window.addEventListener('pagehide', () => { upload.clear(); stop(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && active) stop(); });
