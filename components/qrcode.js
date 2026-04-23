import { encodeQR } from '../qrcode/index.js';
import { svgToPng } from '../qrcode/dom.js';

export class XRCode extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'scale', 'ecc'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._rendered = false;
  }

  connectedCallback() {
    if (!this._rendered) {
      this._render();
      this._rendered = true;
    }
    if (this.value) {
      this.encode(this.value);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (!this._rendered) return;
    if (name === 'value') {
      this.encode(newValue);
    } else if (name === 'scale' || name === 'ecc') {
      if (this.value) {
        this.encode(this.value);
      }
    }
  }

  get value() {
    return this.getAttribute('value') || '';
  }

  get scale() {
    return parseInt(this.getAttribute('scale') || '4', 10);
  }

  get ecc() {
    return this.getAttribute('ecc') || 'medium';
  }

  _render() {
    const style = `
      :host {
        display: inline-block;
        contain: content;
        background: #fff;
        padding: 8px;
        border-radius: 4px;
      }
      img {
        display: block;
      }
    `;

    this.shadowRoot.innerHTML = `<style>${style}</style><div class="content"></div>`;
  }

  get _content() {
    return this.shadowRoot.querySelector('.content');
  }

  async encode(text) {
    const content = this._content;
    if (!content) return;
    if (!text) {
      content.innerHTML = '';
      return;
    }

    const options = { scale: this.scale, ecc: this.ecc };
    const svg = encodeQR(text, 'svg', options);
    const png = await svgToPng(svg, this.scale * 25, this.scale * 25);

    content.innerHTML = '';
    const img = document.createElement('img');
    img.src = png;
    content.appendChild(img);
  }
}

customElements.define('x-qrcode', XRCode);