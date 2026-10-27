// Preact, its hooks and HTM as one entry: html`` templates without a build
// step. They are served from copies beside this file, pinned in
// package.json and generated from the preact and htm packages when the
// package is packed (tools/vendor-react.js), never from a CDN.
import { h } from './preact.js';
import htm from './htm.js';

export * from './preact.js';
export * from './preact-hooks.js';
export const html = htm.bind(h);
