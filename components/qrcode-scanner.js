import decodeQR from '../qrcode/decode.js';
import { requestCamera } from '../media.js';

export class XScanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._stream = null;
    this._animationId = null;
    this._result = null;
  }

  connectedCallback() {
    this._render();
    this._startScan();
  }

  disconnectedCallback() {
    this._stopScan();
  }

  get result() {
    return this._result;
  }

  _render() {
    const style = `
      :host {
        display: block;
        position: relative;
        background: #000;
        border-radius: 4px;
        overflow: hidden;
      }
      video, canvas {
        display: block;
        width: 100%;
      }
      .overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        border: 2px solid rgba(255,255,255,0.5);
        border-radius: 8px;
        pointer-events: none;
      }
      .line {
        position: absolute;
        left: 10px;
        right: 10px;
        height: 2px;
        background: #00ff00;
        animation: scan 2s linear infinite;
      }
      @keyframes scan {
        0%, 100% { top: 10px; }
        50% { top: calc(100% - 10px); }
      }
      .result {
        position: absolute;
        bottom: 10px;
        left: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 8px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <video playsinline autoplay muted></video>
      <div class="overlay"><div class="line"></div></div>
      <div class="result"></div>
    `;
  }

  get _video() {
    return this.shadowRoot.querySelector('video');
  }

  get _resultEl() {
    return this.shadowRoot.querySelector('.result');
  }

  async _startScan() {
    const video = this._video;
    const resultEl = this._resultEl;

    try {
      this._stream = await requestCamera({ facingMode: 'environment' });
      video.srcObject = this._stream;
      video.play();
      this._scan();
    } catch (err) {
      console.error('Camera error:', err);
      resultEl.textContent = err?.name === 'NotAllowedError'
        ? 'Camera access denied'
        : err?.message || err;
    }
  }

  _stopScan() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
  }

  _scan() {
    const video = this._video;
    if (!video || video.readyState !== 4) {
      this._animationId = requestAnimationFrame(() => this._scan());
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      this._animationId = requestAnimationFrame(() => this._scan());
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);

    try {
      const text = decodeQR(imageData);
      if (text && text !== this._result) {
        this._result = text;
        this._resultEl.textContent = text;
        this.dispatchEvent(new CustomEvent('scan', { detail: { value: text } }));
      }
    } catch (e) {}

    this._animationId = requestAnimationFrame(() => this._scan());
  }
}

customElements.define('x-scanner', XScanner);