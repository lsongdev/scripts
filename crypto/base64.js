
export const encodeString = str => btoa(str);
export const decodeToString = base64 => atob(base64);

export const arrayBufferToString = buffer =>
  String.fromCharCode.apply(null, new Uint8Array(buffer));

export const encode = data => {
  if (data instanceof ArrayBuffer || data instanceof Uint8Array)
    data = arrayBufferToString(data);
  return encodeString(data);
};

export const decode = base64 => {
  const binaryString = decodeToString(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const arrayBufferToBase64 = encode;
export const base64ToArrayBuffer = decode;
export const base64UrlEncode = data =>
  encode(data)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
