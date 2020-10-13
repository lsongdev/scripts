

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
  for (const value of reader.read()) {

  }
  reader.releaseLock();
};

export const writeText = (stream, lines) => {
  const writer = createTextWriter(stream);
  lines.forEach(line => writer.write(line));
  return writer.releaseLock();
};
