import {ArrayBufferTarget, Muxer} from './runtime/mp4-muxer.mjs';
import {drawPredictions} from './annotations.js';
import {modelURL} from './model-url.js';

const tasks = ['det', 'seg', 'pose'];
const taskNames = {det: 'Detection', seg: 'Segmentation', pose: 'Pose'};
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
function workerRequest(worker, message, signal, transfer = []) {
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
      worker.postMessage(message, transfer);
    } catch (error) {
      message.frame?.close();
      cleanup();
      reject(error);
    }
  });
}

function makeOutput(task, job, config) {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const context = canvas.getContext('2d', {alpha: false});
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({target, video: {codec: 'vp9', width: canvas.width, height: canvas.height, frameRate}, fastStart: 'in-memory'});
  const url = new URL('./detector.js?v=video2', import.meta.url);
  url.searchParams.set('size', job.size);
  url.searchParams.set('task', task);
  const worker = new Worker(url, {type: 'module'});
  const output = {worker, context, canvas, muxer, target};
  job.output = output;
  output.encoder = new VideoEncoder({
    output(chunk, meta) {
      try { muxer.addVideoChunk(chunk, meta); }
      catch (error) { job.controller.abort(error); }
    },
    error: error => job.controller.abort(error)
  });
  output.encoder.configure(config);
  return output;
}

async function renderFrame(task, output, job, classes, timestamp, duration, index) {
  const signal = job.controller.signal;
  const frame = new VideoFrame(job.video, {timestamp});
  const data = await workerRequest(output.worker, {type: 'frame', frame, threshold: job.threshold}, signal, [frame]);
  try {
    signal.throwIfAborted();
    output.context.drawImage(data.frame, 0, 0);
    drawPredictions(output.context, classes, task, data.results, data.maskOverlay);
  } finally {
    data.frame.close();
    data.maskOverlay?.close();
  }
  const annotated = new VideoFrame(output.canvas, {timestamp, duration});
  try { output.encoder.encode(annotated, {keyFrame: index % (frameRate * 2) === 0}); }
  finally { annotated.close(); }
  if (output.encoder.encodeQueueSize >= 4) await output.encoder.flush();
}

function releaseOutput(job) {
  const output = job.output;
  if (!output) return;
  job.output = null;
  output.worker.terminate();
  if (output.encoder && output.encoder.state !== 'closed') output.encoder.close();
}

async function prefetchModel(task, size, precision, signal) {
  const response = await fetch(modelURL(task, size, precision), {signal, priority: 'low'});
  if (!response.ok) throw new Error(`Could not download the ${taskNames[task]} model (HTTP ${response.status}).`);
  return {modelBytes: await response.arrayBuffer(), precision};
}

async function processVideo(job, view) {
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
  signal.throwIfAborted();
  const total = Math.ceil(video.duration * frameRate);
  const progress = byId('progress');
  progress.max = tasks.length * total;
  let nextModel;
  for (const [stage, task] of tasks.entries()) {
    signal.throwIfAborted();
    job.task = task;
    job.hasFrame = false;
    view.stage(stage, task);
    const weights = await nextModel;
    signal.throwIfAborted();
    if (weights?.error) throw weights.error;
    const output = makeOutput(task, job, config);
    try {
      const {precision} = await workerRequest(output.worker, {type: 'load', ...weights}, signal, weights ? [weights.modelBytes] : []);
      for (let i = 0; i < total; i++) {
        signal.throwIfAborted();
        const time = i / frameRate;
        if (video.currentTime !== time) {
          const seeked = mediaEvent(video, 'seeked', signal);
          video.currentTime = time;
          await seeked;
        }
        signal.throwIfAborted();
        const timestamp = Math.round(time * 1e6);
        const duration = Math.max(1, Math.round(Math.min(video.duration, (i + 1) / frameRate) * 1e6) - timestamp);
        await renderFrame(task, output, job, classes, timestamp, duration, i);
        signal.throwIfAborted();
        job.hasFrame = true;
        view.frame(task, i === 0);
        progress.value = stage * total + i + 1;
        if (i === 0 && stage + 1 < tasks.length) {
          // Download bytes during this pass; create the next GPU session only after this worker is released.
          nextModel = prefetchModel(tasks[stage + 1], job.size, precision, signal).catch(error => ({error}));
        }
      }
      await output.encoder.flush();
      signal.throwIfAborted();
      output.muxer.finalize();
      job.results.set(task, URL.createObjectURL(new Blob([output.target.buffer], {type: 'video/mp4'})));
    } finally {
      releaseOutput(job);
    }
    view.result(task);
  }
}

export function initVideoUpload({stopCamera, message, getTask, selectTask}) {
  let current = null;
  const picker = byId('clip');
  const player = byId('clip-result');
  const clearButton = byId('clear-video');
  const download = byId('download-video');
  const progress = byId('progress');
  const stageLabel = byId('video-stage');
  const choices = byId('task').querySelectorAll('input');
  function clear() {
    if (!current) return;
    current.controller.abort();
    releaseOutput(current);
    player.onloadedmetadata = null;
    player.pause();
    download.hidden = true;
    download.removeAttribute('href');
    player.removeAttribute('src');
    player.load();
    for (const url of current.results.values()) URL.revokeObjectURL(url);
    current = null;
    stageLabel.textContent = '';
    for (const choice of choices) choice.disabled = false;
    clearButton.hidden = player.hidden = progress.hidden = byId('screen').hidden = true;
    byId('idle').hidden = byId('model-size').disabled = byId('threshold').disabled = false;
  }
  function showTask() {
    const job = current;
    if (!job) return;
    const task = getTask();
    const result = job.results.get(task);
    if (result) {
      if (player.getAttribute('src') !== result) {
        const time = player.currentTime;
        const playing = !player.paused;
        player.onloadedmetadata = () => {
          player.currentTime = Math.min(time, player.duration);
          if (playing) player.play().catch(() => {});
        };
        player.src = result;
      }
      download.href = result;
      download.download = job.basename + '-' + task + '.mp4';
      download.hidden = player.hidden = false;
      byId('idle').hidden = byId('screen').hidden = true;
    } else if (task === job.task && job.hasFrame && job.output) {
      if (!player.hidden) player.pause();
      download.hidden = player.hidden = byId('idle').hidden = true;
      const canvas = job.output.canvas;
      const preview = byId('frame');
      if (preview.width !== canvas.width || preview.height !== canvas.height) {
        preview.width = canvas.width;
        preview.height = canvas.height;
      }
      preview.getContext('2d').drawImage(canvas, 0, 0);
      byId('screen').hidden = false;
    }
  }
  player.addEventListener('play', () => { if (current) current.follow = false; });
  picker.addEventListener('change', async () => {
    const file = picker.files[0];
    if (!file) return;
    picker.value = '';
    clear();
    stopCamera();
    const job = {basename: file.name.replace(/\.[^.]+$/, '') || 'LoopDVR', source: URL.createObjectURL(file), video: document.createElement('video'),
      controller: new AbortController(), threshold: Number(byId('threshold').value), size: byId('model-size').value, results: new Map(), follow: true};
    current = job;
    selectTask('det');
    for (const choice of choices) choice.disabled = choice.value !== 'det';
    byId('model-size').disabled = byId('threshold').disabled = true;
    clearButton.hidden = progress.hidden = false;
    clearButton.textContent = 'Cancel processing';
    progress.value = 0;
    message('Opening video and loading LoopDet-S…');
    try {
      await processVideo(job, {
        stage(index, task) {
          stageLabel.textContent = `${index + 1}/3 · Loading ${taskNames[task]}…`;
        },
        frame(task, first) {
          if (first) {
            for (const choice of choices) if (choice.value === task) choice.disabled = false;
            if (job.follow) selectTask(task);
            stageLabel.textContent = `${tasks.indexOf(task) + 1}/3 · ${taskNames[task]}`;
          }
          if (getTask() === task) showTask();
        },
        result(task) { if (getTask() === task) showTask(); }
      });
      job.controller.signal.throwIfAborted();
      stageLabel.textContent = '';
    } catch (error) {
      if (current !== job) return;
      job.controller.abort(error);
      if (!job.results.size) {
        clear();
        message(error.message || 'Video processing failed.', true);
        return;
      }
      stageLabel.textContent = `${taskNames[job.task]} failed. ${error.message || 'Video processing failed.'}`;
      if (!job.results.has(getTask())) selectTask([...job.results.keys()].pop());
      for (const choice of choices) choice.disabled = !job.results.has(choice.value);
      showTask();
    } finally {
      releaseOutput(job);
      job.video.removeAttribute('src');
      job.video.load();
      URL.revokeObjectURL(job.source);
    }
    if (current === job) {
      progress.hidden = true;
      clearButton.textContent = 'Clear video';
    }
  });
  clearButton.onclick = () => { clear(); message(); };
  return {clear, onTaskChange() {
    if (!current) return;
    current.follow = getTask() === current.task;
    showTask();
  }};
}
