function container(target) {
  if (!target?.serviceWorker) throw new ReferenceError('ServiceWorkerContainer is required');
  return target.serviceWorker;
}

/** Register a module service worker and return the native registration. */
export function registerServiceWorker(scriptURL, options = {}, {
  navigator: target = globalThis.navigator,
} = {}) {
  return container(target).register(scriptURL, { type: 'module', ...options });
}

/** Observe native ServiceWorker state changes and return an idempotent disposer. */
export function onServiceWorkerStateChange(worker, listener, { signal } = {}) {
  if (typeof listener !== 'function') throw new TypeError('listener must be a function');
  signal?.throwIfAborted();
  const notify = event => listener(worker.state, event, worker);
  worker.addEventListener('statechange', notify);
  const dispose = () => {
    worker.removeEventListener('statechange', notify);
    signal?.removeEventListener('abort', dispose);
  };
  signal?.addEventListener('abort', dispose, { once: true });
  return dispose;
}
