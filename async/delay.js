/**
 * Resolve a {@linkcode Promise} after a given amount of milliseconds.
 *
 * @throws {DOMException} If the optional signal is aborted before the delay
 * duration, and `signal.reason` is undefined.
 * @param ms Duration in milliseconds for how long the delay should last.
 * @param options Additional options.
 *
 * @example Basic usage
 * ```js
 * import { delay } from "delay.js";
 *
 * // ...
 * const delayedPromise = delay(100);
 * const result = await delayedPromise;
 * // ...
 * ```
 *
 * @example Disable persistence
 *
 * Setting `persistent` to `false` will allow the process to continue to run as
 * long as the timer exists.
 *
 * ```ts no-assert ignore
 * import { delay } from "delay.js";
 *
 * // ...
 * await delay(100, { persistent: false });
 * // ...
 * ```
 */
export function delay(ms, options = {}) {
  const { signal } = options;
  if (signal?.aborted) {
    return Promise.reject(signal.reason);
  }
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(i);
      reject(signal?.reason);
    };
    const done = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const i = setTimeout(done, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
