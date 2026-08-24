function recorderConstructor(value) {
  if (typeof value !== 'function') throw new ReferenceError('MediaRecorder is required');
  return value;
}

/** Construct a native MediaRecorder without starting it. */
export function createMediaRecorder(stream, options, {
  MediaRecorder: Recorder = globalThis.MediaRecorder,
} = {}) {
  return new (recorderConstructor(Recorder))(stream, options);
}

/**
 * Start recording and expose the native recorder plus an owned result lifecycle.
 * The caller continues to own the MediaStream and its tracks.
 */
export function startRecording(stream, {
  timeslice,
  signal,
  ...recorderOptions
} = {}, dependencies) {
  signal?.throwIfAborted();
  if (timeslice !== undefined && (!Number.isFinite(timeslice) || timeslice < 0)) {
    throw new RangeError('timeslice must be a finite non-negative number');
  }

  const recorder = createMediaRecorder(stream, recorderOptions, dependencies);
  const chunks = [];
  let settled = false;
  let resolveResult;
  let rejectResult;

  const result = new Promise((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const cleanup = () => {
    recorder.removeEventListener('dataavailable', onData);
    recorder.removeEventListener('stop', onStop);
    recorder.removeEventListener('error', onError);
    signal?.removeEventListener('abort', onAbort);
  };
  const settle = (operation, value) => {
    if (settled) return;
    settled = true;
    cleanup();
    operation(value);
  };
  const onData = event => {
    if (event.data?.size > 0) chunks.push(event.data);
  };
  const onStop = () => settle(resolveResult, new Blob(chunks, {
    type: recorder.mimeType || chunks[0]?.type || '',
  }));
  const onError = event => settle(rejectResult,
    event.error ?? new DOMException('Media recording failed', 'UnknownError'));
  const onAbort = () => {
    const reason = signal.reason;
    settle(rejectResult, reason);
    if (recorder.state !== 'inactive') recorder.stop();
  };

  recorder.addEventListener('dataavailable', onData);
  recorder.addEventListener('stop', onStop);
  recorder.addEventListener('error', onError);
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    recorder.start(timeslice);
  } catch (error) {
    settle(rejectResult, error);
    throw error;
  }

  return Object.freeze({
    recorder,
    result,
    stop() {
      if (recorder.state !== 'inactive') recorder.stop();
      return result;
    },
  });
}
