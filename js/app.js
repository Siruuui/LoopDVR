(() => {
  'use strict';

  const scenes = [
    { stem: '01_512_000000329827', name: 'Motion blur' },
    { stem: '05_312_000000018380', name: 'Crowded scenes' },
    { stem: '02_249_000000532493', name: 'Object rotation' },
    { stem: '03_043_000000190140', name: 'Severe truncation' },
    { stem: '04_338_000000448410', name: 'Occlusion' },
    { stem: '06_472_000000125936', name: 'Occlusion' },
    { stem: '07_008_000000501005', name: 'Occlusion' },
    { stem: '08_342_000000133969', name: 'Defocus' },
    { stem: '09_339_000000551820', name: 'Motion blur' }
  ];
  const tasks = {
    detection: { suffix: 'det', name: 'Object detection', model: 'LoopDet-X' },
    segmentation: { suffix: 'seg', name: 'Instance segmentation', model: 'LoopSeg-X' },
    pose: { suffix: 'pose', name: 'Human pose estimation', model: 'LoopPose-X' }
  };
  const pad = number => String(number).padStart(2, '0');
  const caseSource = (task, index) => `assets/cases/${task}/${scenes[index].stem}_${tasks[task].suffix}.webp`;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gallery = document.querySelector('#case-gallery');
  const casePanel = document.querySelector('#case-panel');
  const taskButtons = Array.from(document.querySelectorAll('#case-tabs [data-task]'));
  const videoTaskButtons = Array.from(document.querySelectorAll('#qualitative-viewer-tabs [data-video-task]'));
  const videoPanel = document.querySelector('#qualitative-viewer-panel');
  let selectedTask = 'segmentation';

  function setTabState(buttons, selected, attribute) {
    buttons.forEach(button => {
      const active = button.dataset[attribute] === selected;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  function bindTabKeys(buttons, select) {
    buttons.forEach((button, index) => {
      button.addEventListener('keydown', event => {
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = buttons.length - 1;
        if (nextIndex === undefined) return;
        event.preventDefault();
        event.stopPropagation();
        select(buttons[nextIndex]);
        buttons[nextIndex].focus();
      });
    });
  }

  let hovered = false;
  let interacting = false;
  let frameId = null;
  let previousFrameTime = null;
  let scrollPosition = 0;
  let loopWidth = 0;
  const scrollSpeed = 54;
  gallery.style.scrollSnapType = 'none';
  gallery.style.scrollBehavior = 'auto';

  function preferencePaused() {
    return reducedMotion.matches;
  }

  function shouldAnimate() {
    return !preferencePaused() && !hovered && !interacting && !document.hidden &&
      !gallery.contains(document.activeElement) && !viewer.open && loopWidth > 0;
  }

  function animateGallery(timestamp) {
    frameId = null;
    if (!shouldAnimate()) {
      previousFrameTime = null;
      return;
    }
    if (previousFrameTime !== null) {
      const elapsed = Math.min(timestamp - previousFrameTime, 64);
      scrollPosition = (scrollPosition + scrollSpeed * elapsed / 1000) % loopWidth;
      gallery.scrollLeft = scrollPosition;
    }
    previousFrameTime = timestamp;
    frameId = requestAnimationFrame(animateGallery);
  }

  function syncGalleryMotion() {
    if (shouldAnimate()) {
      if (frameId === null) {
        scrollPosition = gallery.scrollLeft % loopWidth;
        previousFrameTime = null;
        frameId = requestAnimationFrame(animateGallery);
      }
    } else {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      previousFrameTime = null;
    }
  }

  function measureGallery() {
    const first = gallery.children[0];
    const duplicate = gallery.children[scenes.length];
    if (!first || !duplicate) return;
    const nextWidth = duplicate.getBoundingClientRect().left - first.getBoundingClientRect().left;
    if (nextWidth <= 0) return;
    if (loopWidth > 0 && nextWidth !== loopWidth) scrollPosition = scrollPosition / loopWidth * nextWidth;
    loopWidth = nextWidth;
    scrollPosition %= loopWidth;
    gallery.scrollLeft = scrollPosition;
    syncGalleryMotion();
  }

  function renderGallery(task) {
    if (!Object.hasOwn(tasks, task)) return;
    selectedTask = task;
    setTabState(taskButtons, task, 'task');
    setTabState(videoTaskButtons, task, 'videoTask');
    const activeButton = taskButtons.find(button => button.dataset.task === task);
    casePanel.setAttribute('aria-labelledby', activeButton.id);
    videoPanel.setAttribute('aria-labelledby', videoTaskButtons.find(button => button.dataset.videoTask === task).id);
    const fragment = document.createDocumentFragment();
    for (let copy = 0; copy < 2; copy += 1) {
      scenes.forEach((scene, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'case-card';
        card.dataset.scene = String(index);
        card.setAttribute('aria-label', `View ${tasks[task].model} ${tasks[task].name.toLowerCase()}: ${scene.name}`);
        if (copy > 0) {
          card.setAttribute('aria-hidden', 'true');
          card.tabIndex = -1;
          card.addEventListener('mousedown', event => event.preventDefault());
        }
        const image = document.createElement('img');
        image.src = caseSource(task, index);
        image.alt = copy > 0 ? '' : `${tasks[task].model} predictions — ${scene.name.toLowerCase()}`;
        image.width = 1200;
        image.height = 800;
        image.loading = index < 3 ? 'eager' : 'lazy';
        image.decoding = 'async';
        image.draggable = false;
        const caption = document.createElement('span');
        caption.className = 'case-caption';
        caption.textContent = `${pad(index + 1)}  ${scene.name}`;
        card.append(image, caption);
        card.addEventListener('click', () => openCase(index, gallery.children[index]));
        fragment.append(card);
      });
    }
    scrollPosition = gallery.scrollLeft;
    gallery.replaceChildren(fragment);
    measureGallery();
    casePanel.dispatchEvent(new CustomEvent('qualitative-taskchange', { detail: tasks[task] }));
  }

  function selectTask(task) {
    if (!Object.hasOwn(tasks, task) || task === selectedTask) return;
    renderGallery(task);
  }

  taskButtons.forEach(button => button.addEventListener('click', () => selectTask(button.dataset.task)));
  bindTabKeys(taskButtons, button => selectTask(button.dataset.task));
  videoTaskButtons.forEach(button => button.addEventListener('click', () => selectTask(button.dataset.videoTask)));
  bindTabKeys(videoTaskButtons, button => selectTask(button.dataset.videoTask));
  gallery.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovered = true;
    syncGalleryMotion();
  });
  gallery.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    hovered = false;
    syncGalleryMotion();
  });
  gallery.addEventListener('pointerdown', () => {
    interacting = true;
    syncGalleryMotion();
  });
  function releaseGalleryPointer() {
    if (!interacting) return;
    interacting = false;
    syncGalleryMotion();
  }
  window.addEventListener('pointerup', releaseGalleryPointer);
  window.addEventListener('pointercancel', releaseGalleryPointer);
  window.addEventListener('blur', releaseGalleryPointer);
  gallery.addEventListener('focusin', syncGalleryMotion);
  gallery.addEventListener('focusout', () => queueMicrotask(syncGalleryMotion));
  gallery.addEventListener('scroll', () => {
    if (frameId === null) scrollPosition = gallery.scrollLeft;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    interacting = false;
    if (!document.hidden) hovered = window.matchMedia('(hover: hover)').matches && gallery.matches(':hover');
    syncGalleryMotion();
  });
  reducedMotion.addEventListener('change', syncGalleryMotion);
  new ResizeObserver(measureGallery).observe(gallery);

  const viewer = document.querySelector('#case-viewer');
  const viewerImage = document.querySelector('#viewer-image');
  const viewerTitle = document.querySelector('#viewer-title');
  const viewerCaption = document.querySelector('#viewer-caption');
  const viewerPrevious = document.querySelector('#viewer-prev');
  const viewerNext = document.querySelector('#viewer-next');
  const viewerTaskTabs = document.querySelector('#viewer-task-tabs');
  const viewerTaskButtons = Array.from(document.querySelectorAll('[data-viewer-task]'));
  let viewerIndex = 0;
  let viewerTask = selectedTask;
  let viewerMode = 'case';
  let returnFocus = null;
  let previousBodyOverflow = '';

  function showViewer(opener) {
    returnFocus = opener;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    viewer.showModal();
    syncGalleryMotion();
  }

  function renderViewer() {
    const scene = scenes[viewerIndex];
    const task = tasks[viewerTask];
    viewerTitle.textContent = `${task.model} · ${scene.name}`;
    viewerImage.src = caseSource(viewerTask, viewerIndex);
    viewerImage.alt = `${task.model} ${task.name.toLowerCase()} predictions for ${scene.name.toLowerCase()}`;
    viewerCaption.textContent = `${pad(viewerIndex + 1)} / ${pad(scenes.length)} · ${task.name} · COCO ${scene.stem.split('_')[2]}`;
    setTabState(viewerTaskButtons, viewerTask, 'viewerTask');
    viewerPrevious.disabled = viewerIndex === 0;
    viewerNext.disabled = viewerIndex === scenes.length - 1;
  }

  function openCase(index, opener) {
    viewerMode = 'case';
    viewerIndex = index;
    viewerTask = selectedTask;
    viewerTaskTabs.hidden = false;
    viewerPrevious.hidden = false;
    viewerNext.hidden = false;
    renderViewer();
    showViewer(opener);
  }

  function moveViewer(direction) {
    if (viewerMode !== 'case') return;
    viewerIndex = Math.min(scenes.length - 1, Math.max(0, viewerIndex + direction));
    renderViewer();
  }

  function selectViewerTask(button) {
    const task = button.dataset.viewerTask;
    if (!Object.hasOwn(tasks, task)) return;
    viewerTask = task;
    renderViewer();
  }

  viewerTaskButtons.forEach(button => button.addEventListener('click', () => selectViewerTask(button)));
  bindTabKeys(viewerTaskButtons, selectViewerTask);
  viewerPrevious.addEventListener('click', () => moveViewer(-1));
  viewerNext.addEventListener('click', () => moveViewer(1));
  document.querySelector('#viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (viewerMode !== 'case') return;
    event.preventDefault();
    moveViewer(event.key === 'ArrowLeft' ? -1 : 1);
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.body.style.overflow = previousBodyOverflow;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    syncGalleryMotion();
  });
  document.querySelectorAll('[data-zoom]').forEach(button => {
    button.addEventListener('click', () => {
      viewerMode = 'figure';
      viewerTaskTabs.hidden = true;
      viewerPrevious.hidden = true;
      viewerNext.hidden = true;
      viewerImage.src = button.dataset.zoom;
      const caption = button.dataset.caption || button.querySelector('img').alt;
      viewerImage.alt = caption;
      viewerTitle.textContent = caption;
      viewerCaption.textContent = '';
      showViewer(button);
    });
  });

  const copyBibtex = document.querySelector('#copy-bibtex');
  const bibtex = document.querySelector('#bibtex-entry').textContent.trim();
  const copyLabel = copyBibtex.querySelector('span');
  const copyStatus = document.querySelector('#bibtex-copy-status');
  let copyFeedbackTimer;
  copyBibtex.disabled = !bibtex;
  copyBibtex.addEventListener('click', async () => {
    let label;
    let status;
    try {
      await navigator.clipboard.writeText(bibtex);
      label = 'Copied';
      status = 'BibTeX copied to clipboard.';
    } catch {
      label = 'Copy failed';
      status = 'Could not copy BibTeX.';
    }
    clearTimeout(copyFeedbackTimer);
    copyLabel.textContent = label;
    copyStatus.textContent = status;
    copyFeedbackTimer = setTimeout(() => {
      copyLabel.textContent = 'Copy BibTeX';
      copyStatus.textContent = '';
    }, 2000);
  });

  renderGallery(selectedTask);
  syncGalleryMotion();
})();
