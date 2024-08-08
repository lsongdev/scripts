
export const encode = data => btoa(data);
export const decode = data => atob(data);

// Utility functions
export const arrayBufferToBase64 = buffer =>
  encode(String.fromCharCode.apply(null, new Uint8Array(buffer)));

export const base64ToArrayBuffer = base64 => {
  const binaryString = decode(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export function base64UrlEncode(str) {
  return encode(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
