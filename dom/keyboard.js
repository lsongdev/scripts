/** Register a filtered keyboard listener and return an idempotent disposer. */
export function onKey(target, key, listener, {
  event = 'keydown',
  signal,
  ...options
} = {}) {
  if (typeof listener !== 'function') throw new TypeError('listener must be a function');
  signal?.throwIfAborted();
  const matches = typeof key === 'function'
    ? key
    : keyboardEvent => keyboardEvent.key === key;
  const handle = keyboardEvent => {
    if (matches(keyboardEvent)) listener.call(target, keyboardEvent);
  };
  target.addEventListener(event, handle, { ...options, signal });
  return () => target.removeEventListener(event, handle, options);
}
