import {ArrayBufferTarget, Muxer} from './runtime/mp4-muxer.mjs';
import {drawPredictions} from './annotations.js';

const tasks = ['det', 'seg', 'pose'];
const frameRate = 24;
const byId = id => document.getElementById(id);

function mediaEvent(video, name, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    function finish(event) {
      video.removeEventListener(name, finish);
      video.removeEventListener('error', finish);
      signal.removeEventListener('abort', finish);
      if (signal.aborted) reject(signal.reason);
      else if (event.type === 'error') reject(new Error('This video could not be decoded. Choose a video your browser can play.'));
      else resolve();
    }
    video.addEventListener(name, finish);
    video.addEventListener('error', finish);
    signal.addEventListener('abort', finish);
  });
}

// Each worker accepts one frame at a time and returns that same frame with its predictions.
function workerRequest(worker, message, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.onmessage = worker.onerror = null;
      signal.removeEventListener('abort', cancel);
    };
    const cancel = () => { cleanup(); reject(signal.reason); };
    signal.addEventListener('abort', cancel);
    worker.onmessage = ({data}) => {
      cleanup();
      if (data.type === 'error') reject(new Error(data.message));
      else resolve(data);
    };
    worker.onerror = event => { cleanup(); reject(new Error(event.message || 'Could not start the inference worker.')); };
    try {
      worker.postMessage(message, message.frame ? [message.frame] : []);
    } catch (error) {
      message.frame?.close();
      cleanup();
      reject(error);
    }
  });
}

function makeOutput(task, job, size, config) {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const context = canvas.getContext('2d', {alpha: false});
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({target, video: {codec: 'vp9', width: canvas.width, height: canvas.height, frameRate}, fastStart: 'in-memory'});
  const encoder = new VideoEncoder({
    output(chunk, meta) {
      try { muxer.addVideoChunk(chunk, meta); }
      catch (error) { job.controller.abort(error); }
    },
    error: error => job.controller.abort(error)
  });
  const url = new URL('./detector.js', import.meta.url);
  url.searchParams.set('size', size);
  url.searchParams.set('task', task);
  const worker = new Worker(url, {type: 'module'});
  const output = {worker, encoder, context, canvas, muxer, target};
  job.outputs.set(task, output);
  encoder.configure(config);
  return output;
}

async function renderFrame(task, output, job, classes, sourceFrame, duration, index) {
  const signal = job.controller.signal;
  const data = await workerRequest(output.worker, {type: 'frame', frame: sourceFrame.clone(), threshold: job.threshold}, signal);
  try {
    signal.throwIfAborted();
    output.context.drawImage(data.frame, 0, 0);
    drawPredictions(output.context, classes, task, data.results, data.maskOverlay);
  } finally {
    data.frame.close();
    data.maskOverlay?.close();
  }
  const annotated = new VideoFrame(output.canvas, {timestamp: sourceFrame.timestamp, duration});
  try { output.encoder.encode(annotated, {keyFrame: index % (frameRate * 2) === 0}); }
  finally { annotated.close(); }
  if (output.encoder.encodeQueueSize >= 4) await output.encoder.flush();
}

function releaseInference(job) {
  for (const output of job.outputs.values()) {
    output.worker.terminate();
    if (output.encoder.state !== 'closed') output.encoder.close();
  }
  job.outputs.clear();
  job.video.removeAttribute('src');
  job.video.load();
  URL.revokeObjectURL(job.source);
}

async function processVideo(job, status, updatePreview) {
  const signal = job.controller.signal;
  if (!navigator.gpu || !window.VideoFrame || !window.VideoEncoder) {
    throw new Error('Use desktop Chrome or Edge with WebGPU enabled over HTTPS or localhost.');
  }
  const video = job.video;
  const loaded = mediaEvent(video, 'loadeddata', signal);
  video.preload = 'auto';
  video.src = job.source;
  await loaded;
  if (!(Number.isFinite(video.duration) && video.duration > 0 && video.videoWidth && video.videoHeight)) {
    throw new Error('The selected file must contain a video track with a finite duration.');
  }
  const config = {codec: 'vp09.00.10.08', width: video.videoWidth, height: video.videoHeight,
    bitrate: Math.max(1000000, video.videoWidth * video.videoHeight * 4), framerate: frameRate, latencyMode: 'realtime'};
  if (!(await VideoEncoder.isConfigSupported(config)).supported) throw new Error('This browser cannot encode results at this video resolution.');
  const response = await fetch('./classes.json', {signal});
  if (!response.ok) throw new Error('Could not load the class labels.');
  const classes = await response.json();
  for (const task of tasks) {
    signal.throwIfAborted();
    const output = makeOutput(task, job, byId('model-size').value, config);
    await workerRequest(output.worker, {type: 'load'}, signal);
  }
  const total = Math.ceil(video.duration * frameRate);
  const progress = byId('progress');
  progress.max = total;
  status('Processing all three tasks…');
  for (let i = 0; i < total; i++) {
    signal.throwIfAborted();
    const time = i / frameRate;
    if (i) {
      const seeked = mediaEvent(video, 'seeked', signal);
      video.currentTime = time;
      await seeked;
    }
    const timestamp = Math.round(time * 1e6);
    const duration = Math.max(1, Math.round(Math.min(video.duration, (i + 1) / frameRate) * 1e6) - timestamp);
    const frame = new VideoFrame(video, {timestamp});
    try {
      await Promise.all(tasks.map(task => renderFrame(task, job.outputs.get(task), job, classes, frame, duration, i)));
    } finally { frame.close(); }
    signal.throwIfAborted();
    job.hasFrame = true;
    progress.value = i + 1;
    updatePreview();
  }
  for (const [task, output] of job.outputs) {
    await output.encoder.flush();
    signal.throwIfAborted();
    output.muxer.finalize();
    job.results.set(task, URL.createObjectURL(new Blob([output.target.buffer], {type: 'video/mp4'})));
  }
}

export function initVideoUpload({stopCamera, message, getTask}) {
  let current = null;
  const picker = byId('clip');
  const player = byId('clip-result');
  const clearButton = byId('clear-video');
  const download = byId('download-video');
  const progress = byId('progress');
  function clear() {
    if (!current) return;
    current.controller.abort();
    player.onloadedmetadata = null;
    player.pause();
    download.hidden = true;
    download.removeAttribute('href');
    player.removeAttribute('src');
    player.load();
    for (const url of current.results.values()) URL.revokeObjectURL(url);
    current = null;
    clearButton.hidden = player.hidden = progress.hidden = byId('screen').hidden = true;
    byId('idle').hidden = byId('model-size').disabled = byId('threshold').disabled = false;
  }
  function showTask() {
    const job = current;
    if (!job) return;
    const task = getTask();
    if (job.complete) {
      const time = player.currentTime;
      const playing = !player.paused;
      player.onloadedmetadata = () => {
        player.currentTime = Math.min(time, player.duration);
        if (playing) player.play().catch(() => {});
      };
      const result = job.results.get(task);
      player.src = result;
      download.href = result;
      download.download = job.basename + '-' + task + '.mp4';
      download.hidden = false;
      player.hidden = false;
      byId('screen').hidden = true;
    } else if (job.hasFrame) {
      const canvas = job.outputs.get(task).canvas;
      const preview = byId('frame');
      if (preview.width !== canvas.width || preview.height !== canvas.height) {
        preview.width = canvas.width;
        preview.height = canvas.height;
      }
      preview.getContext('2d').drawImage(canvas, 0, 0);
      byId('screen').hidden = false;
    } else return;
    byId('idle').hidden = true;
  }
  picker.addEventListener('change', async () => {
    const file = picker.files[0];
    if (!file) return;
    picker.value = '';
    clear();
    stopCamera();
    const job = {basename: file.name.replace(/\.[^.]+$/, '') || 'LoopDVR', source: URL.createObjectURL(file), video: document.createElement('video'),
      controller: new AbortController(), threshold: Number(byId('threshold').value), outputs: new Map(), results: new Map()};
    current = job;
    byId('model-size').disabled = byId('threshold').disabled = true;
    clearButton.hidden = progress.hidden = false;
    clearButton.textContent = 'Cancel processing';
    progress.value = 0;
    message('Opening video and loading the three models…');
    try {
      await processVideo(job, message, showTask);
      job.controller.signal.throwIfAborted();
      job.complete = true;
      showTask();
      progress.hidden = true;
      clearButton.textContent = 'Clear video';
    } catch (error) {
      if (current === job) {
        clear();
        message(error.message || 'Video processing failed.', true);
      }
    } finally {
      releaseInference(job);
    }
  });
  clearButton.onclick = () => { clear(); message(); };
  return {clear, showTask};
}
