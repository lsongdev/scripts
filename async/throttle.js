/** Create a leading/trailing throttle with explicit flush, clear, and signal lifecycle. */
export function throttle(fn, wait, { signal } = {}) {
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  if (!Number.isFinite(wait) || wait < 0) throw new RangeError('wait must be finite and non-negative');
  signal?.throwIfAborted();
  let timer;
  let lastCall = -Infinity;
  let pending;

  const invoke = () => {
    if (!pending) return undefined;
    const { receiver, args } = pending;
    pending = undefined;
    lastCall = performance.now();
    return fn.apply(receiver, args);
  };
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };
  const throttled = function (...args) {
    signal?.throwIfAborted();
    pending = { receiver: this, args };
    const remaining = wait - (performance.now() - lastCall);
    if (remaining <= 0) {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      return invoke();
    }
    if (timer === undefined) {
      timer = setTimeout(() => { timer = undefined; invoke(); }, remaining);
    }
    return undefined;
  };
  throttled.clear = clear;
  throttled.flush = () => {
    signal?.throwIfAborted();
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    return invoke();
  };
  Object.defineProperty(throttled, 'pending', { get: () => pending !== undefined });
  signal?.addEventListener('abort', clear, { once: true });
  return throttled;
}
