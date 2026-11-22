(() => {
  'use strict';

  const section = document.querySelector('#quantitative-results');
  if (!section) return;
  const data = window.LOOPDVR_RESULTS;
  const svg = section.querySelector('#benchmark-chart');
  const plot = section.querySelector('#benchmark-plot');
  const tooltip = section.querySelector('#benchmark-tooltip');
  const count = section.querySelector('#benchmark-count');
  const taskButtons = Array.from(section.querySelectorAll('[data-benchmark-task]'));
  const rangeButtons = Array.from(section.querySelectorAll('[data-parameter-range]'));
  const tasks = {
    detection: { title: 'COCO box AP', color: '#d56d82' },
    instance_segmentation: { title: 'COCO mask AP', color: '#9772b6' },
    pose: { title: 'COCO keypoint AP', color: '#429b93' }
  };
  const ranges = {
    all: { accepts: () => true },
    under10: { accepts: p => p >= 0 && p < 10 },
    '10to20': { accepts: p => p >= 10 && p < 20 },
    '20to30': { accepts: p => p >= 20 && p < 30 },
    '30to40': { accepts: p => p >= 30 && p <= 40 }
  };
  let selectedTask = 'detection';
  let selectedRange = 'all';
  let selectedPoint = null;
  let chartWidth = 0;

  if (!data || !Array.isArray(data.models)) {
    count.textContent = 'Results data unavailable';
    return;
  }
  const models = data.models.filter(model => Object.hasOwn(tasks, model.task) &&
    Number.isFinite(model.params) && model.params > 0 && model.params <= 70 && Number.isFinite(model.ap) &&
    model.ap >= (model.task === 'detection' ? 35 : model.task === 'instance_segmentation' ? 30 : 55));
  const modelById = new Map(models.map(model => [model.id, model]));

  function element(name, attributes = {}, text) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function niceStep(span, intervals) {
    const raw = Math.max(span / intervals, .01);
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const fraction = raw / magnitude;
    return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10) * magnitude;
  }

  function ticks(min, max, step) {
    const result = [];
    for (let value = Math.ceil(min / step) * step; value <= max + step / 100; value += step) {
      result.push(Math.round(value * 100) / 100);
    }
    return result;
  }

  function inputLabel(model) {
    if (typeof model.resolution === 'number') return `${model.resolution} × ${model.resolution}`;
    return model.resolution ? String(model.resolution).replace(/x/gi, ' × ') : '';
  }

  function resetDetails() {
    selectedPoint = null;
    tooltip.hidden = true;
    svg.querySelectorAll('.is-selected').forEach(point => point.classList.remove('is-selected'));
  }

  function highlightRange() {
    const accepts = ranges[selectedRange].accepts;
    const taskModels = models.filter(model => model.task === selectedTask);
    const highlighted = taskModels.filter(model => accepts(model.params)).length;
    svg.querySelectorAll('[data-model-id]').forEach(node => {
      const model = modelById.get(node.dataset.modelId);
      node.classList.toggle('is-muted', !model || !accepts(model.params));
    });
    const line = svg.querySelector('.benchmark-loop-line');
    if (line) line.classList.toggle('is-muted', selectedRange !== 'all');
    count.textContent = selectedRange === 'all'
      ? `${taskModels.length} models · val2017`
      : `${highlighted} of ${taskModels.length} highlighted · val2017`;
  }

  function inspectPoint(model, point, x, y) {
    svg.querySelectorAll('.is-selected').forEach(node => node.classList.remove('is-selected'));
    point.classList.add('is-selected');
    selectedPoint = point;
    tooltip.replaceChildren();
    const name = document.createElement('strong');
    name.textContent = model.model;
    const numbers = document.createElement('span');
    numbers.textContent = `${model.ap.toFixed(1)} AP · ${model.params.toFixed(1)}M parameters`;
    tooltip.append(name, numbers);
    const coincident = models.filter(other => other.task === model.task && other.id !== model.id && other.params === model.params && other.ap === model.ap);
    if (coincident.length) {
      const shared = document.createElement('span');
      shared.textContent = `Same point: ${coincident.map(other => other.model).join(', ')}`;
      tooltip.append(shared);
    }
    const input = inputLabel(model);
    if (input) {
      const resolution = document.createElement('span');
      resolution.textContent = `Input: ${input}`;
      tooltip.append(resolution);
    }
    tooltip.hidden = false;
    const tooltipWidth = tooltip.offsetWidth;
    tooltip.style.left = `${Math.max(0, Math.min(chartWidth - tooltipWidth, x + 13))}px`;
    tooltip.style.top = `${Math.max(0, y - tooltip.offsetHeight - 12)}px`;

  }

  function renderChart() {
    chartWidth = plot.clientWidth;
    if (!chartWidth) return;
    const compact = chartWidth < 550;
    const height = chartWidth * 9 / 16;
    const margin = { top: 36, right: compact ? 16 : 24, bottom: 48, left: compact ? 37 : 47 };
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const task = tasks[selectedTask];
    const points = models.filter(model => model.task === selectedTask);
    const xMin = 0;
    const xStep = niceStep(Math.max(10, ...points.map(p => p.params)), compact ? 4 : 7);
    const xMax = Math.min(70, Math.ceil(Math.max(xStep, ...points.map(p => p.params)) / xStep) * xStep);
    const minAP = points.length ? Math.min(...points.map(p => p.ap)) : 0;
    const maxAP = points.length ? Math.max(...points.map(p => p.ap)) : 100;
    const yStep = niceStep(Math.max(maxAP - minAP, 5), 6);
    const yMin = Math.max(0, Math.floor(minAP / yStep) * yStep);
    const upperAP = selectedTask === 'instance_segmentation' ? Math.ceil(maxAP + .3) : Math.ceil(maxAP / yStep) * yStep;
    const yMax = Math.min(100, Math.max(yMin + yStep, upperAP));
    const xScale = value => margin.left + (value - xMin) / (xMax - xMin) * innerWidth;
    const yScale = value => margin.top + (yMax - value) / (yMax - yMin || 1) * innerHeight;

    section.style.setProperty('--result-accent', task.color);
    section.dataset.task = selectedTask;
    section.querySelector('#benchmark-title').textContent = `${task.title} vs. parameters`;
    count.textContent = `${points.length} models · val2017`;
    svg.setAttribute('viewBox', `0 0 ${chartWidth} ${height}`);
    svg.setAttribute('height', String(height));
    svg.replaceChildren(
      element('title', { id: 'benchmark-svg-title' }, `${task.title} versus parameters`),
      element('desc', { id: 'benchmark-svg-desc' }, `${points.length} models. Fewer parameters are to the left; higher accuracy is above. Focus or select any point for exact values.`)
    );
    resetDetails();

    ticks(yMin, yMax, yStep).forEach(value => {
      const y = yScale(value);
      svg.append(element('line', { x1: margin.left, x2: chartWidth - margin.right, y1: y, y2: y, class: 'benchmark-grid' }));
      svg.append(element('text', { x: margin.left - 10, y: y + 4, 'text-anchor': 'end', class: 'benchmark-tick' }, value));
    });
    const xTicks = ticks(xMin, xMax, xStep);
    if (xTicks[xTicks.length - 1] !== xMax) xTicks.push(xMax);
    xTicks.forEach(value => {
      const x = xScale(value);
      svg.append(element('line', { x1: x, x2: x, y1: margin.top, y2: height - margin.bottom, class: 'benchmark-grid' }));
      svg.append(element('text', { x, y: height - margin.bottom + 21, 'text-anchor': 'middle', class: 'benchmark-tick' }, value));
    });
    svg.append(
      element('path', { d: `M${margin.left},${margin.top}V${height - margin.bottom}H${chartWidth - margin.right}`, fill: 'none', class: 'benchmark-axis' }),
      element('text', { x: margin.left, y: 16, class: 'benchmark-axis-label' }, `${task.title} (%)`),
      element('text', { x: margin.left + innerWidth / 2, y: height - 5, 'text-anchor': 'middle', class: 'benchmark-axis-label' }, 'Parameters (M)')
    );
    if (!points.length) {
      svg.append(element('text', { x: chartWidth / 2, y: height / 2, 'text-anchor': 'middle', class: 'benchmark-empty' }, 'No model results available.'));
      return;
    }

    const ours = points.filter(model => model.group === 'loopdvr').sort((a, b) => a.params - b.params);
    if (ours.length > 1) {
      svg.append(element('polyline', { points: ours.map(p => `${xScale(p.params)},${yScale(p.ap)}`).join(' '), class: 'benchmark-loop-line' }));
    }
    points.sort((a, b) => Number(a.group === 'loopdvr') - Number(b.group === 'loopdvr') || a.params - b.params);
    points.forEach(model => {
      const x = xScale(model.params);
      const y = yScale(model.ap);
      const isOurs = model.group === 'loopdvr';
      const point = element('g', {
        class: 'benchmark-point', transform: `translate(${x},${y})`, tabindex: 0, role: 'button',
        'data-model-id': model.id,
        'data-group': isOurs ? 'loopdvr' : 'baseline',
        'aria-label': `${model.model}, ${model.params.toFixed(1)} million parameters, ${model.ap.toFixed(1)} AP`
      });
      point.append(element('circle', { r: 10, fill: 'transparent' }), element('circle', { r: isOurs ? 10 : 8, class: 'point-halo' }));
      if (isOurs && selectedTask === 'detection') {
        point.append(element('rect', { x: -5, y: -5, width: 10, height: 10, rx: 1, fill: 'currentColor', class: 'point-marker' }));
      } else if (isOurs && selectedTask === 'instance_segmentation') {
        point.append(element('path', { d: 'M0 -7L7 0L0 7L-7 0Z', fill: 'currentColor', class: 'point-marker' }));
      } else {
        point.append(element('circle', { r: isOurs ? 5.5 : 4.3, fill: 'currentColor', class: 'point-marker' }));
      }
      const inspect = () => inspectPoint(model, point, x, y);
      point.addEventListener('pointerenter', inspect);
      point.addEventListener('focus', inspect);
      point.addEventListener('click', inspect);
      point.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inspect(); }
      });
      svg.append(point);
    });
    const labelBounds = [];
    ours.forEach(model => {
      const x = xScale(model.params);
      const y = yScale(model.ap);
      const label = compact ? model.model : `${model.model} · ${model.ap.toFixed(1)}`;
      const text = element('text', { 'data-model-id': model.id, class: 'benchmark-point-label' }, label);
      svg.append(text);
      const width = text.getComputedTextLength();
      const left = Math.max(4, Math.min(x - width / 2, chartWidth - width - 4));
      let baseline = y - 10;
      if (labelBounds.some(box => left < box.right + 4 && left + width + 4 > box.left && Math.abs(baseline - box.baseline) < 15)) {
        baseline = y + 17;
      }
      text.setAttribute('x', String(left));
      text.setAttribute('y', String(baseline));
      labelBounds.push({ left, right: left + width, baseline });
    });
    highlightRange();
  }

  function selectTask(button) {
    if (!Object.hasOwn(tasks, button.dataset.benchmarkTask)) return;
    selectedTask = button.dataset.benchmarkTask;
    taskButtons.forEach(tab => {
      const active = tab === button;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    section.querySelector('#benchmark-panel').setAttribute('aria-labelledby', button.id);
    renderChart();
  }

  taskButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectTask(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % taskButtons.length;
      if (event.key === 'ArrowLeft') next = (index + taskButtons.length - 1) % taskButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = taskButtons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTask(taskButtons[next]);
      taskButtons[next].focus();
    });
  });
  rangeButtons.forEach(button => button.addEventListener('click', () => {
    if (!Object.hasOwn(ranges, button.dataset.parameterRange)) return;
    selectedRange = button.dataset.parameterRange;
    rangeButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    resetDetails();
    highlightRange();
  }));
  plot.addEventListener('pointerleave', () => { tooltip.hidden = true; });
  svg.addEventListener('focusout', event => {
    if (!svg.contains(event.relatedTarget)) tooltip.hidden = true;
  });
  svg.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selectedPoint) resetDetails();
  });
  new ResizeObserver(() => {
    if (plot.clientWidth !== chartWidth) renderChart();
  }).observe(plot);
  renderChart();
})();
