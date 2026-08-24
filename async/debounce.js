/**
 * Delay invocation until calls have stopped for `wait` milliseconds.
 *
 * The returned function exposes `clear()`, `flush()`, and `pending` without
 * introducing a scheduler or lifecycle outside the platform.
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn
 * @param {number} wait
 * @param {{ signal?: AbortSignal }} [options]
 */
export function debounce(fn, wait, { signal } = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }
  if (!Number.isFinite(wait) || wait < 0) {
    throw new RangeError('wait must be a finite, non-negative number');
  }

  let timeout;
  let pendingCall;

  function clear() {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = undefined;
    pendingCall = undefined;
  }

  function flush() {
    signal?.throwIfAborted();
    if (!pendingCall) return;
    const call = pendingCall;
    clear();
    return Reflect.apply(fn, call.thisArg, call.args);
  }

  function debounced(...args) {
    signal?.throwIfAborted();
    if (timeout !== undefined) clearTimeout(timeout);
    pendingCall = { thisArg: this, args };
    timeout = setTimeout(flush, wait);
  }

  Object.defineProperties(debounced, {
    clear: { value: clear },
    flush: { value: flush },
    pending: { get: () => pendingCall !== undefined },
  });

  signal?.addEventListener('abort', clear, { once: true });
  return debounced;
}
