import { delay } from './delay.js';

/** Retry an async operation with explicit attempt, delay, and cancellation policy. */
export async function retry(operation, {
  attempts = 3,
  delay: delayFor = 0,
  shouldRetry = () => true,
  signal,
} = {}) {
  if (typeof operation !== 'function') throw new TypeError('operation must be a function');
  if (!Number.isSafeInteger(attempts) || attempts < 1) {
    throw new RangeError('attempts must be a positive safe integer');
  }
  if (typeof delayFor !== 'number' && typeof delayFor !== 'function') {
    throw new TypeError('delay must be a number or function');
  }
  if (typeof shouldRetry !== 'function') throw new TypeError('shouldRetry must be a function');

  for (let attempt = 1; ; attempt += 1) {
    signal?.throwIfAborted();
    try {
      return await operation({ attempt, signal });
    } catch (error) {
      if (attempt >= attempts || !await shouldRetry(error, attempt)) throw error;
      const milliseconds = typeof delayFor === 'function'
        ? await delayFor(error, attempt)
        : delayFor;
      await delay(milliseconds, { signal });
    }
  }
}
