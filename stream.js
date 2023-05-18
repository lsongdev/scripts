

export const createTextReader = stream => {
  const decoder = new TextDecoderStream();
  stream.pipeTo(decoder.writable);
  const inputStream = decoder.readable;
  return inputStream.getReader();
};

export const createTextWriter = stream => {
  const encoder = new TextEncoderStream();
  encoder.readable.pipeTo(stream);
  const outputStream = encoder.writable;
  return outputStream.getWriter();
};

export const readText = stream => {
  const reader = createTextReader(stream);
  const lines = [];
  for (const value of reader.read()) {
    lines.push(value);
  }
  reader.releaseLock();
  return lines;
};

export const writeText = (stream, lines) => {
  const writer = createTextWriter(stream);
  lines.forEach(line => writer.write(line));
  writer.releaseLock();
  return writer;
};


export async function* readLines(reader) {
  const decoder = new TextDecoder();
  let buffer = '', done = false, value;
  do {
    ({ value, done } = await reader.read());
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) {
        yield line;
      }
    }
  } while (!done);
  if (buffer.trim()) {
    yield buffer;
  }
}

export async function* parseJSONLines(reader) {
  for await (const line of readLines(reader)) {
    yield JSON.parse(line);
  }
}
