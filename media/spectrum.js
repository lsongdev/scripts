function finite(value, name, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum) {
    throw new RangeError(`${name} must be finite and at least ${minimum}`);
  }
  return value;
}

/** Draw one frequency-data frame into a caller-owned 2D context. */
export function drawSpectrum(context, values, {
  background = '#000',
  barGap = 1,
  color = '#4fc08d',
  minHeight = 1,
} = {}) {
  finite(barGap, 'barGap');
  finite(minHeight, 'minHeight');
  const { width, height } = context.canvas;
  const count = values.length;
  const barWidth = count ? Math.max(0, (width - barGap * (count - 1)) / count) : 0;
  context.save();
  try {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    for (let index = 0; index < count; index += 1) {
      const ratio = values[index] / 255;
      const barHeight = Math.min(height, minHeight + ratio * Math.max(0, height - minHeight));
      context.fillStyle = typeof color === 'function' ? color(ratio, index, values) : color;
      context.fillRect(index * (barWidth + barGap), height - barHeight, barWidth, barHeight);
    }
  } finally {
    context.restore();
  }
  return context;
}

/** Own a cancellable requestAnimationFrame loop around a native AnalyserNode. */
export function createSpectrumRenderer(canvas, analyser, {
  signal,
  requestFrame = globalThis.requestAnimationFrame,
  cancelFrame = globalThis.cancelAnimationFrame,
  ...drawOptions
} = {}) {
  if (!canvas?.getContext) throw new TypeError('canvas must be an HTMLCanvasElement');
  if (!analyser || typeof analyser.getByteFrequencyData !== 'function') {
    throw new TypeError('analyser must be an AnalyserNode');
  }
  if (typeof requestFrame !== 'function' || typeof cancelFrame !== 'function') {
    throw new ReferenceError('requestAnimationFrame and cancelAnimationFrame are required');
  }
  signal?.throwIfAborted();
  const context = canvas.getContext('2d');
  if (!context) throw new ReferenceError('CanvasRenderingContext2D is required');
  let frame;
  let running = false;
  let values = new Uint8Array(analyser.frequencyBinCount);

  const draw = () => {
    if (values.length !== analyser.frequencyBinCount) values = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(values);
    drawSpectrum(context, values, drawOptions);
    return values;
  };
  const tick = () => {
    if (!running) return;
    draw();
    if (running) frame = requestFrame(tick);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    if (frame !== undefined) cancelFrame(frame);
    frame = undefined;
    signal?.removeEventListener('abort', stop);
  };
  const start = () => {
    signal?.throwIfAborted();
    if (running) return;
    running = true;
    signal?.addEventListener('abort', stop, { once: true });
    frame = requestFrame(tick);
  };
  return Object.freeze({
    canvas,
    analyser,
    context,
    draw,
    start,
    stop,
    get running() { return running; },
  });
}
