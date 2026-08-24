const events = ['visibilitychange', 'pageshow', 'pagehide', 'freeze', 'resume'];

export function getPageLifecycleState({
  document: target = globalThis.document,
} = {}) {
  if (!target) throw new ReferenceError('Document is required');
  return Object.freeze({
    visibilityState: target.visibilityState,
    hidden: target.hidden,
  });
}

/** Observe standard page lifecycle signals without synthesizing application states. */
export function observePageLifecycle(listener, {
  document: target = globalThis.document,
  window: view = globalThis.window,
  signal,
} = {}) {
  if (typeof listener !== 'function') throw new TypeError('listener must be a function');
  if (!target || !view) throw new ReferenceError('Document and Window are required');
  signal?.throwIfAborted();

  const notify = event => listener(getPageLifecycleState({ document: target }), event);
  target.addEventListener('visibilitychange', notify);
  for (const type of events.slice(1)) view.addEventListener(type, notify);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    target.removeEventListener('visibilitychange', notify);
    for (const type of events.slice(1)) view.removeEventListener(type, notify);
    signal?.removeEventListener('abort', dispose);
  };
  signal?.addEventListener('abort', dispose, { once: true });
  return dispose;
}
