import { defineElement } from './define.js';
import { createSpectrumRenderer } from '../media/spectrum.js';

export class SpectrumView extends HTMLElement {
  #canvas;
  #analyser;
  #renderer;
  #resizeObserver;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:block;min-height:8rem}canvas{display:block;height:100%;width:100%}';
    this.#canvas = document.createElement('canvas');
    this.#canvas.part = 'canvas';
    root.append(style, this.#canvas);
  }

  connectedCallback() {
    this.#resizeObserver = new ResizeObserver(() => this.resize());
    this.#resizeObserver.observe(this);
    this.resize();
  }

  disconnectedCallback() {
    this.stop();
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
  }

  get analyser() { return this.#analyser; }
  set analyser(value) {
    if (value === this.#analyser) return;
    this.stop();
    this.#analyser = value;
  }

  get running() { return this.#renderer?.running ?? false; }

  resize() {
    const ratio = globalThis.devicePixelRatio || 1;
    const bounds = this.getBoundingClientRect();
    this.#canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    this.#canvas.height = Math.max(1, Math.round(bounds.height * ratio));
  }

  start(options) {
    if (!this.#analyser) throw new TypeError('analyser must be assigned before start()');
    this.stop();
    this.#renderer = createSpectrumRenderer(this.#canvas, this.#analyser, options);
    this.#renderer.start();
    return this.#renderer;
  }

  stop() {
    this.#renderer?.stop();
    this.#renderer = undefined;
  }
}

export const defineSpectrumView = registry =>
  defineElement('spectrum-view', SpectrumView, undefined, registry);
