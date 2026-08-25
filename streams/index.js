/** Decode a byte stream into a stream of strings. */
export function decodeText(stream, { encoding = 'utf-8', ...options } = {}) {
  return stream.pipeThrough(new TextDecoderStream(encoding, options));
}

/** Encode a stream of strings into UTF-8 bytes. */
export function encodeText(stream) {
  return stream.pipeThrough(new TextEncoderStream());
}

/**
 * Iterate a ReadableStream without leaking its reader lock.
 * Aborting cancels the underlying stream with the signal reason.
 */
export async function* readStream(stream, { signal } = {}) {
  signal?.throwIfAborted();
  const reader = stream.getReader();
  const abort = () => {
    void reader.cancel(signal.reason).catch(() => {});
  };
  signal?.addEventListener('abort', abort, { once: true });

  try {
    while (true) {
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      if (done) return;
      yield value;
    }
  } finally {
    signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}

/** Read an entire byte or string stream as text. */
export async function readText(stream, { encoding = 'utf-8', signal } = {}) {
  const decoder = new TextDecoder(encoding);
  let output = '';

  for await (const chunk of readStream(stream, { signal })) {
    output += typeof chunk === 'string'
      ? chunk
      : decoder.decode(chunk, { stream: true });
  }

  return output + decoder.decode();
}

/** Iterate text lines without discarding blank lines. */
export async function* readLines(stream, { encoding = 'utf-8', signal } = {}) {
  const decoder = new TextDecoder(encoding);
  let buffer = '';

  for await (const chunk of readStream(stream, { signal })) {
    buffer += typeof chunk === 'string'
      ? chunk
      : decoder.decode(chunk, { stream: true });

    let newline;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline);
      yield line.endsWith('\r') ? line.slice(0, -1) : line;
      buffer = buffer.slice(newline + 1);
    }
  }

  buffer += decoder.decode();
  if (buffer) yield buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer;
}

/** Parse a newline-delimited JSON stream. */
export async function* parseJSONLines(stream, {
  encoding = 'utf-8',
  signal,
  skipBlank = true,
} = {}) {
  for await (const line of readLines(stream, { encoding, signal })) {
    if (skipBlank && !line.trim()) continue;
    yield JSON.parse(line);
  }
}

/** Write string chunks to a WritableStream and close it when complete. */
export async function writeText(stream, chunks, { signal } = {}) {
  signal?.throwIfAborted();
  const writer = stream.getWriter();
  const abort = () => {
    void writer.abort(signal.reason).catch(() => {});
  };
  signal?.addEventListener('abort', abort, { once: true });

  try {
    for await (const chunk of chunks) {
      signal?.throwIfAborted();
      await writer.write(String(chunk));
    }
    await writer.close();
  } catch (error) {
    await writer.abort(error).catch(() => {});
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
    writer.releaseLock();
  }
}
