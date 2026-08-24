import { linear } from './easing.js';

function finite(value, name, minimum = -Infinity) {
  if (!Number.isFinite(value) || value < minimum) {
    throw new RangeError(`${name} must be finite and at least ${minimum}`);
  }
}

/** Interpolate numeric record fields on animation frames with explicit ownership. */
export function tween({
  cancelAnimationFrame: cancelFrame = globalThis.cancelAnimationFrame,
  delay = 0,
  duration = 500,
  easing = linear,
  from,
  now = () => performance.now(),
  onUpdate,
  requestAnimationFrame: requestFrame = globalThis.requestAnimationFrame,
  signal,
  to,
}) {
  finite(delay, 'delay', 0);
  finite(duration, 'duration', 0);
  if (typeof easing !== 'function') throw new TypeError('easing must be a function');
  if (typeof onUpdate !== 'function') throw new TypeError('onUpdate must be a function');
  if (typeof requestFrame !== 'function' || typeof cancelFrame !== 'function') {
    throw new ReferenceError('requestAnimationFrame and cancelAnimationFrame are required');
  }
  signal?.throwIfAborted();

  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  const startValues = {};
  const endValues = {};
  for (const key of keys) {
    startValues[key] = from[key] ?? to[key];
    endValues[key] = to[key] ?? from[key];
    finite(startValues[key], `from.${key}`);
    finite(endValues[key], `to.${key}`);
  }

  let frame;
  let settled = false;
  const startTime = now() + delay;
  let resolveFinished;
  let rejectFinished;
  const finished = new Promise((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });
  const cleanup = () => signal?.removeEventListener('abort', abort);
  const cancel = (reason = new DOMException('Tween canceled', 'AbortError')) => {
    if (settled) return;
    settled = true;
    if (frame !== undefined) cancelFrame(frame);
    cleanup();
    rejectFinished(reason);
  };
  const abort = () => cancel(signal.reason);
  signal?.addEventListener('abort', abort, { once: true });

  const update = timestamp => {
    if (settled) return;
    if (timestamp < startTime) {
      frame = requestFrame(update);
      return;
    }
    const progress = duration === 0 ? 1 : Math.min((timestamp - startTime) / duration, 1);
    const eased = easing(progress);
    const state = Object.fromEntries([...keys].map(key => [
      key,
      startValues[key] + (endValues[key] - startValues[key]) * eased,
    ]));
    onUpdate(Object.freeze(state), progress);
    if (progress === 1) {
      settled = true;
      cleanup();
      resolveFinished(state);
      return;
    }
    frame = requestFrame(update);
  };

  frame = requestFrame(update);
  return Object.freeze({ cancel, finished });
}
