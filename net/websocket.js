/**
 * Open and return a standard WebSocket once its `open` event fires.
 * AbortSignal owns the socket lifecycle and closes it when aborted.
 */
export function connect(url, {
  protocols,
  signal,
  WebSocket: WebSocketConstructor = globalThis.WebSocket,
} = {}) {
  if (!WebSocketConstructor) throw new ReferenceError('WebSocket is required');
  signal?.throwIfAborted();

  const socket = protocols === undefined
    ? new WebSocketConstructor(url)
    : new WebSocketConstructor(url, protocols);

  return new Promise((resolve, reject) => {
    let pending = true;

    const cleanupOpening = () => {
      socket.removeEventListener('open', open);
      socket.removeEventListener('error', error);
    };
    const cleanup = () => {
      cleanupOpening();
      signal?.removeEventListener('abort', abort);
      socket.removeEventListener('close', cleanup);
    };
    const open = () => {
      pending = false;
      cleanupOpening();
      resolve(socket);
    };
    const error = event => {
      pending = false;
      cleanup();
      reject(event);
    };
    const abort = () => {
      socket.close(1000, 'Aborted');
      if (pending) {
        pending = false;
        cleanup();
        reject(signal.reason);
      }
    };

    socket.addEventListener('open', open, { once: true });
    socket.addEventListener('error', error, { once: true });
    socket.addEventListener('close', cleanup, { once: true });
    signal?.addEventListener('abort', abort, { once: true });
  });
}

/**
 * Expose WebSocket MessageEvents as a standard ReadableStream.
 * Canceling the stream detaches listeners but does not close the socket.
 */
export function createMessageStream(socket, { signal } = {}) {
  signal?.throwIfAborted();

  return new ReadableStream({
    start(controller) {
      const message = event => controller.enqueue(event);
      const error = event => {
        cleanup();
        controller.error(event);
      };
      const close = () => {
        cleanup();
        controller.close();
      };
      const abort = () => {
        cleanup();
        controller.error(signal.reason);
      };
      const cleanup = () => {
        socket.removeEventListener('message', message);
        socket.removeEventListener('error', error);
        socket.removeEventListener('close', close);
        signal?.removeEventListener('abort', abort);
      };

      socket.addEventListener('message', message);
      socket.addEventListener('error', error, { once: true });
      socket.addEventListener('close', close, { once: true });
      signal?.addEventListener('abort', abort, { once: true });
      this.cleanup = cleanup;
    },
    cancel() {
      this.cleanup?.();
    },
  });
}
