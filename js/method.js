(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));

  function createPlayer({ video, observedElement, status, control, controlLabel, initialTime, render, reveal, complete, label, canPlay, blockedControl, autoplayDelay = 400 }) {
    let visible = false;
    let desired = false;
    let readyToAutoplay = false;
    let autoplayTimer = null;
    let automatic = false;
    let autoStarted = false;
    let pendingSeek = initialTime;
    let stopTime = null;
    let revision = 0;
    let frameId = null;
    let finished = false;
    let controlState = '';
    const controlIcons = control ? Array.from(control.querySelectorAll('[data-icon]')) : [];

    function syncControl() {
      if (!control) return;
      const state = finished || video.ended ? 'replay' : video.paused ? 'play' : 'pause';
      if (state === controlState) return;
      controlState = state;
      controlIcons.forEach(icon => icon.toggleAttribute('hidden', icon.dataset.icon !== state));
      control.setAttribute('aria-label', `${state[0].toUpperCase()}${state.slice(1)} ${controlLabel}`);
    }

    function stopFrames() {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    }

    function suspend() {
      revision += 1;
      video.pause();
      stopFrames();
      syncControl();
    }

    function update() {
      let time = pendingSeek === null ? video.currentTime : pendingSeek;
      if (stopTime !== null && pendingSeek === null && time >= stopTime) {
        desired = false;
        revision += 1;
        video.pause();
        stopFrames();
        time = stopTime;
        if (Math.abs(video.currentTime - stopTime) > 0.002) video.currentTime = stopTime;
      }
      render?.(time, finished);
      syncControl();
    }

    function tick() {
      frameId = null;
      update();
      if (!video.paused && !video.ended) frameId = requestAnimationFrame(tick);
    }

    async function play() {
      if (!desired || document.hidden || (canPlay && !canPlay())) return;
      const currentRevision = revision;
      try {
        await video.play();
      } catch (error) {
        if (revision !== currentRevision || error.name === 'AbortError') return;
        desired = false;
        if (error.name === 'NotAllowedError' && blockedControl) blockedControl.hidden = false;
        if (error.name !== 'NotAllowedError') status.textContent = `The ${label} video could not be played. Press Play to try again.`;
        update();
      }
    }

    function applySeek() {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA && pendingSeek !== null) {
        const target = Math.min(pendingSeek, video.duration);
        if (video.currentTime !== target) video.currentTime = target;
        pendingSeek = null;
      }
      update();
      if (desired && visible && video.paused) play();
    }

    function request(start, end, isAutomatic = false) {
      if (!isAutomatic) {
        const bounds = observedElement.getBoundingClientRect();
        visible = bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 &&
          bounds.top < window.innerHeight && bounds.right > 0 && bounds.left < window.innerWidth;
      }
      revision += 1;
      video.pause();
      stopFrames();
      desired = true;
      automatic = isAutomatic;
      autoStarted = true;
      finished = false;
      stopTime = end === null ? null : Math.max(start, end - 0.04);
      pendingSeek = start;
      status.textContent = '';
      if (reveal) reveal();
      render?.(start, false);
      applySeek();
      syncControl();
    }

    function cancelAutoplay() {
      if (autoplayTimer === null) return;
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }

    function scheduleAutoplay() {
      if (!readyToAutoplay || autoStarted || autoplayTimer !== null ||
          document.hidden || reducedMotion.matches) return;
      if (autoplayDelay === 0) {
        request(0, null, true);
        return;
      }
      autoplayTimer = setTimeout(() => {
        autoplayTimer = null;
        if (readyToAutoplay && !autoStarted && !document.hidden && !reducedMotion.matches) {
          request(0, null, true);
        }
      }, autoplayDelay);
    }

    control?.addEventListener('click', () => {
      if (finished || video.ended) {
        request(0, null);
      } else if (!video.paused) {
        desired = false;
        automatic = false;
        autoStarted = true;
        suspend();
      } else {
        request(pendingSeek === null ? video.currentTime : pendingSeek, null);
      }
    });
    blockedControl?.addEventListener('click', () => request(pendingSeek ?? video.currentTime, null));
    video.muted = true;
    video.addEventListener('loadedmetadata', applySeek);
    video.addEventListener('timeupdate', update);
    video.addEventListener('seeked', update);
    video.addEventListener('playing', () => {
      if (blockedControl) blockedControl.hidden = true;
    });
    video.addEventListener('play', () => {
      syncControl();
      if (render && frameId === null) frameId = requestAnimationFrame(tick);
    });
    video.addEventListener('pause', () => {
      stopFrames();
      update();
    });
    video.addEventListener('ended', () => {
      if (!video.ended) return;
      desired = false;
      finished = true;
      revision += 1;
      stopFrames();
      if (complete) complete();
      render?.(video.duration, true);
      syncControl();
    });
    video.addEventListener('error', () => {
      desired = false;
      suspend();
      status.textContent = `The ${label} video could not be loaded. Please reload the page to try again.`;
    });
    const observer = new IntersectionObserver(entries => {
      const entry = entries[entries.length - 1];
      const wasVisible = visible;
      visible = entry.isIntersecting && entry.intersectionRatio > 0;
      readyToAutoplay = visible && entry.intersectionRatio >= 0.25;
      if (readyToAutoplay) scheduleAutoplay();
      else cancelAutoplay();
      if (!visible) suspend();
      else if (!wasVisible && desired && !finished) applySeek();
    }, { threshold: [0, 0.25] });
    observer.observe(observedElement);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAutoplay();
        suspend();
      } else {
        scheduleAutoplay();
        if (visible && desired && !finished) applySeek();
      }
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        cancelAutoplay();
        if (automatic) {
          desired = false;
          suspend();
        }
      } else scheduleAutoplay();
    });
    applySeek();
    render?.(initialTime, false);
    syncControl();
    return {
      request,
      suspend,
      position: () => pendingSeek ?? video.currentTime,
      resume(time) {
        if (time !== undefined) pendingSeek = time;
        applySeek();
      }
    };
  }

  function setProgress(button, progress, active, complete) {
    button.style.setProperty('--stage-progress', `${clamp(progress) * 100}%`);
    button.classList.toggle('is-active', active);
    button.classList.toggle('is-complete', complete);
    if (active) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }

  const qualitativeVideo = document.querySelector('#qualitative-video');
  const qualitativeOpen = document.querySelector('#qualitative-open');
  const qualitativePlay = document.querySelector('#qualitative-play');
  const qualitativeFrame = qualitativeOpen.closest('.qualitative-frame');
  const qualitativeViewer = document.querySelector('#qualitative-viewer');
  const enlargedVideo = document.querySelector('#qualitative-enlarged');
  const enlargedTitle = document.querySelector('#qualitative-viewer-title');
  const enlargedPanel = document.querySelector('#qualitative-viewer-panel');
  const fullscreen = document.querySelector('#qualitative-fullscreen');
  const inlineStatus = document.querySelector('#qualitative-status');
  const viewerStatus = document.querySelector('#qualitative-viewer-status');
  const showInlineLayer = qualitativeOverlay.attach(qualitativeVideo, qualitativeOpen.querySelector('canvas'));
  const showEnlargedLayer = qualitativeOverlay.attach(enlargedVideo, enlargedPanel.querySelector('canvas'));
  let selectedLayer = null;
  let loadedLayer = null;
  let previewHovered = false;
  let enlargedStart = 0;
  const qualitativePlayer = createPlayer({
    video: qualitativeVideo,
    observedElement: qualitativeVideo,
    status: inlineStatus,
    blockedControl: qualitativePlay,
    initialTime: 0,
    label: 'qualitative results',
    autoplayDelay: 0,
    canPlay: () => loadedLayer && (!previewHovered || !qualitativePlay.hidden) && !qualitativeViewer.open
  });
  document.querySelector('#case-panel').addEventListener('qualitative-taskchange', async event => {
    const {suffix, name} = event.detail;
    selectedLayer = suffix;
    loadedLayer = null;
    qualitativeVideo.setAttribute('aria-label', `${name} video`);
    qualitativeOpen.setAttribute('aria-label', `Enlarge ${name.toLowerCase()} video`);
    enlargedVideo.setAttribute('aria-label', `${name} video`);
    enlargedTitle.textContent = `${name} video`;
    showInlineLayer(null);
    showEnlargedLayer(null);
    inlineStatus.textContent = viewerStatus.textContent = '';
    try {
      const layer = await qualitativeOverlay.load(suffix);
      if (selectedLayer !== suffix) return;
      loadedLayer = layer;
      showInlineLayer(layer);
      if (qualitativeViewer.open) showEnlargedLayer(layer);
      qualitativePlayer.resume();
    } catch (error) {
      if (selectedLayer === suffix) inlineStatus.textContent = viewerStatus.textContent = error.message;
    }
  });

  qualitativeFrame.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    if (!qualitativePlay.hidden) return;
    previewHovered = true;
    qualitativePlayer.suspend();
  });
  qualitativeFrame.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    previewHovered = false;
    qualitativePlayer.resume();
  });

  qualitativeOpen.addEventListener('click', () => {
    enlargedStart = qualitativePlayer.position();
    qualitativeViewer.showModal();
    qualitativePlayer.suspend();
    enlargedVideo.src = qualitativeVideo.src;
    enlargedVideo.currentTime = enlargedStart;
    showEnlargedLayer(loadedLayer);
    enlargedVideo.play().catch(() => { /* Native controls allow manual playback. */ });
  });
  fullscreen.hidden = !document.fullscreenEnabled;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await enlargedPanel.requestFullscreen();
    } catch {
      viewerStatus.textContent = 'Fullscreen could not be opened.';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen');
  });
  document.querySelector('#qualitative-close').addEventListener('click', () => qualitativeViewer.close());
  qualitativeViewer.addEventListener('click', event => {
    if (event.target !== qualitativeViewer) return;
    const bounds = qualitativeViewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) qualitativeViewer.close();
  });
  qualitativeViewer.addEventListener('close', () => {
    const time = enlargedVideo.readyState >= HTMLMediaElement.HAVE_METADATA ? enlargedVideo.currentTime : enlargedStart;
    enlargedVideo.pause();
    showEnlargedLayer(null);
    enlargedVideo.removeAttribute('src');
    enlargedVideo.load();
    previewHovered = window.matchMedia('(hover: hover)').matches && qualitativeFrame.matches(':hover');
    qualitativePlayer.resume(time);
  });

  const stages = [
    {
      start: 0,
      end: 3.3,
      jump: 0.4,
      title: 'Backbone grouping and initialization',
      description: 'We group contiguous backbone layers using their representation similarity and initialize each shared block from the pretrained weights of its group’s final layer.'
    },
    {
      start: 3.3,
      end: 5.3,
      jump: 3.5,
      title: 'Looped Transformer block',
      description: 'We reuse the same Transformer block across logical layers. Lightweight Loop Adapters retain depth-specific transformations while the main Transformer weights are shared.'
    },
    {
      start: 5.3,
      end: 6.4,
      jump: 5.6,
      title: 'Backbone distillation',
      description: 'A frozen, detection-specialized DINOv3 teacher transfers visual representations to the looped backbone using unlabeled images. The shared blocks, Loop Adapters, and feature projector are optimized jointly.'
    },
    {
      start: 6.4,
      end: 10,
      jump: 6.8,
      title: 'Dense recognition post-training',
      description: 'We combine the distilled backbone with a hybrid encoder and a looped query decoder, then train task-specific models on COCO: LoopDet, LoopSeg, and LoopPose.'
    }
  ];
  const methodVideo = document.querySelector('#pipeline-video');
  const overview = document.querySelector('#method-overview');
  const stageNumber = document.querySelector('#stage-number');
  const stageTitle = document.querySelector('#stage-title');
  const stageDescription = document.querySelector('#stage-description');
  const stageButtons = Array.from(document.querySelectorAll('#stage-timeline [data-stage]'));
  let displayedStage = '';

  function renderMethod(time, finished) {
    const index = stages.reduce((latest, stage, candidate) => time >= stage.start ? candidate : latest, 0);
    const key = finished ? 'overview' : String(index);
    if (displayedStage !== key) {
      displayedStage = key;
      stageNumber.hidden = finished;
      stageNumber.textContent = String(index + 1);
      stageTitle.textContent = finished ? 'Method overview' : stages[index].title;
      stageDescription.textContent = finished
        ? 'Representation-based grouping and initialization, backbone distillation, and dense recognition post-training turn a pretrained Transformer into a parameter-efficient looped network.'
        : stages[index].description;
    }
    stageButtons.forEach(button => {
      const current = Number(button.dataset.stage);
      const stage = stages[current];
      setProgress(button, (time - stage.start) / (stage.end - stage.start), !finished && current === index, time >= stage.end);
    });
  }

  const methodPlayer = createPlayer({
    video: methodVideo,
    observedElement: methodVideo.closest('.method-media'),
    status: document.querySelector('#pipeline-status'),
    control: document.querySelector('#method-toggle'),
    controlLabel: 'Method video',
    initialTime: 0.4,
    label: 'method',
    render: renderMethod,
    reveal() {
      overview.hidden = true;
      methodVideo.hidden = false;
    },
    complete() {
      methodVideo.hidden = true;
      overview.hidden = false;
    }
  });
  stageButtons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.stage);
    const stage = stages[index];
    methodPlayer.request(stage.jump, null);
  }));

  const attentionPhases = [
    { start: 0, end: 6, jump: 0.6 },
    { start: 6, end: 10, jump: 6.05 }
  ];
  const attentionVideo = document.querySelector('#attention-video');
  const attentionButtons = Array.from(document.querySelectorAll('#attention-timeline [data-attention-stage]'));
  const attentionPlayer = createPlayer({
    video: attentionVideo,
    observedElement: attentionVideo,
    status: document.querySelector('#attention-status'),
    control: document.querySelector('#attention-toggle'),
    controlLabel: 'Looped Inference video',
    initialTime: 0,
    label: 'attention',
    render(time, finished) {
      attentionButtons.forEach(button => {
        const phase = attentionPhases[Number(button.dataset.attentionStage)];
        setProgress(button, (time - phase.start) / (phase.end - phase.start),
          !finished && time >= phase.start && time < phase.end, time >= phase.end);
      });
    }
  });
  attentionButtons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.attentionStage);
    const phase = attentionPhases[index];
    attentionPlayer.request(phase.jump, index === attentionPhases.length - 1 ? null : phase.end);
  }));
})();
