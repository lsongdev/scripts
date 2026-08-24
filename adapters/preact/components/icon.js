import { h } from '../react.js';

/** Render an image-backed icon without selecting a provider or issuing fetches. */
export const Icon = ({ src, alt = '', ...properties }) =>
  h('img', { ...properties, src, alt });
