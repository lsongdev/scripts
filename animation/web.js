/** Start a native Web Animation and bind optional cancellation ownership. */
export function animate(element, keyframes, options, { signal } = {}) {
  signal?.throwIfAborted();
  if (typeof element.animate !== 'function') {
    throw new ReferenceError('Web Animations API is required');
  }
  const animation = element.animate(keyframes, options);
  const cancel = () => animation.cancel();
  signal?.addEventListener('abort', cancel, { once: true });
  void animation.finished.finally(() => {
    signal?.removeEventListener('abort', cancel);
  }).catch(() => {});
  return animation;
}
