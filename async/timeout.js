/** Reject after a deadline. Cancellation of the underlying operation is signal-driven. */
export async function withTimeout(operation, milliseconds, {
  signal,
  reason = new DOMException('The operation timed out', 'TimeoutError'),
} = {}) {
  if (typeof operation !== 'function') throw new TypeError('operation must be a function');
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError('milliseconds must be a finite non-negative number');
  }
  signal?.throwIfAborted();

  const controller = new AbortController();
  const forwardAbort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', forwardAbort, { once: true });
  const timer = setTimeout(() => controller.abort(reason), milliseconds);
  const aborted = new Promise((resolve, reject) => {
    controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true });
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation({ signal: controller.signal })),
      aborted,
    ]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
