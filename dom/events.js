/**
 * Add an event listener and return a disposer.
 * Native AddEventListenerOptions, including `signal`, pass through unchanged.
 */
export function on(target, type, listener, options) {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
}

/**
 * Delegate an event to the closest matching descendant of `root`.
 */
export function delegate(root, type, selector, listener, options) {
  return on(root, type, event => {
    const origin = event.target;
    if (!(origin instanceof Element)) return;
    const target = origin.closest(selector);
    if (!target || !root.contains(target)) return;
    Reflect.apply(listener, target, [event]);
  }, options);
}

/**
 * Resolve when a Document is ready and optionally invoke a callback.
 */
export function ready(callback, {
  document: target = document,
  signal,
} = {}) {
  signal?.throwIfAborted();

  const promise = /interactive|complete/.test(target.readyState)
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
      const done = () => {
        signal?.removeEventListener('abort', abort);
        resolve();
      };
      const abort = () => {
        target.removeEventListener('DOMContentLoaded', done);
        reject(signal.reason);
      };
      target.addEventListener('DOMContentLoaded', done, { once: true });
      signal?.addEventListener('abort', abort, { once: true });
    });

  return typeof callback === 'function' ? promise.then(callback) : promise;
}
