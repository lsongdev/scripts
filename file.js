import { addEventListener } from './dom.js';

export const readFileAsText = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  addEventListener(reader, 'error', reject);
  addEventListener(reader, 'load', () => resolve(reader.result));
  return reader.readAsText(file);
});