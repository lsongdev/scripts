import { defineElement } from './define.js';

export class Icon extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'alt'];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host { display: inline-block; inline-size: 1em; block-size: 1em; }
      img { display: block; inline-size: 100%; block-size: 100%; }
    `;
    this.image = document.createElement('img');
    this.image.part = 'image';
    shadow.append(style, this.image);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.render();
  }

  render() {
    if (!this.image) return;
    const src = this.getAttribute('src');
    if (src) {
      this.image.src = src;
      this.image.hidden = false;
    } else {
      this.image.removeAttribute('src');
      this.image.hidden = true;
    }
    this.image.alt = this.getAttribute('alt') || '';
  }
}

export const defineIcon = registry =>
  defineElement('x-icon', Icon, undefined, registry);
