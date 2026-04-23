import { encodeQR } from '../../qrcode/index.js';
import { svgToPng } from '../../qrcode/dom.js';

// import decodeQR from 'qr/decode.js';
// See separate README section for decoding.

const txt = 'Hello world';
const ascii = encodeQR(txt, 'ascii'); // Not all fonts are supported
const terminalFriendly = encodeQR(txt, 'term'); // 2x larger, all fonts are OK
const gifBytes = encodeQR(txt, 'gif'); // Uncompressed GIF
const svgElement = encodeQR(txt, 'svg'); // SVG vector image element
const array = encodeQR(txt, 'raw'); // 2d array for canvas or other libs

// Options
// Custom error correction level
// low: 7%, medium: 15% (default), quartile: 25%, high: 30%
const highErrorCorrection = encodeQR(txt, 'gif', { ecc: 'high' });
// Custom encoding: 'numeric', 'alphanumeric' or 'byte'
const customEncoding = encodeQR(txt, 'gif', { encoding: 'byte' });
// Default scale is 2: each block is 2x2 pixels.
const larger = encodeQR(txt, 'gif', { scale: 4 });
// All options
// type QrOpts = {
//   ecc?: 'low' | 'medium' | 'quartile' | 'high';
//   encoding?: 'numeric' | 'alphanumeric' | 'byte' | 'kanji' | 'eci';
//   textEncoder?: (text: string) => Uint8Array;
//   version?: number; // 1..40, QR code version
//   mask?: number; // 0..7, mask number
//   border?: number; // Border size, default 2.
//   scale?: number; // Scale to this number. Scale=2 -> each block will be 2x2 pixels
// };
const png = await svgToPng(svgElement, 512, 512); // .png, using DOM
document.getElementById("img").src = png;
