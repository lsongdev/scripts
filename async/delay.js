/**
 * Resolve after `milliseconds`, or reject with the AbortSignal reason.
 *
 * @param {number} milliseconds
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<void>}
 */
export function delay(milliseconds, { signal } = {}) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError('milliseconds must be a finite, non-negative number');
  }

  signal?.throwIfAborted();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(done, milliseconds);

    function done() {
      signal?.removeEventListener('abort', abort);
      resolve();
    }

    function abort() {
      clearTimeout(timeout);
      reject(signal.reason);
    }

    signal?.addEventListener('abort', abort, { once: true });
  });
}
