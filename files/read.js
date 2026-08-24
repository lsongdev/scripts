/** Read a Blob as text, optionally using a non-UTF-8 encoding. */
export async function readText(blob, { encoding = 'utf-8' } = {}) {
  if (!(blob instanceof Blob)) throw new TypeError('Expected a Blob');
  if (encoding.toLowerCase() === 'utf-8') return blob.text();
  return new TextDecoder(encoding).decode(await blob.arrayBuffer());
}

/** Read a Blob as an ArrayBuffer. */
export function readArrayBuffer(blob) {
  if (!(blob instanceof Blob)) throw new TypeError('Expected a Blob');
  return blob.arrayBuffer();
}
