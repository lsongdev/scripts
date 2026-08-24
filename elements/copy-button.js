import { defineElement } from './define.js';

export class CopyButton extends HTMLElement {
  static observedAttributes = ['disabled'];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const button = document.createElement('button');
    button.type = 'button';
    button.part = 'button';
    button.append(document.createElement('slot'));
    root.append(button);
    button.addEventListener('click', () => {
      void this.copy().catch(error => {
        this.dispatchEvent(new CustomEvent('copyerror', { detail: { error } }));
      });
    });
  }

  connectedCallback() {
    if (!this.textContent.trim()) this.textContent = 'Copy';
    this.#syncDisabled();
  }

  attributeChangedCallback() {
    this.#syncDisabled();
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    this.toggleAttribute('disabled', Boolean(value));
  }

  get value() {
    return this.getAttribute('value');
  }

  set value(value) {
    if (value == null) this.removeAttribute('value');
    else this.setAttribute('value', value);
  }

  #syncDisabled() {
    const button = this.shadowRoot?.querySelector('button');
    if (button) button.disabled = this.disabled;
  }

  #sourceText() {
    if (this.hasAttribute('value')) return this.getAttribute('value');
    const id = this.getAttribute('for');
    if (!id) throw new SyntaxError('copy-button requires value or for');
    const source = this.ownerDocument.getElementById(id);
    if (!source) throw new ReferenceError(`Copy source not found: ${id}`);
    if (typeof source.value === 'string') return source.value;
    if (source instanceof HTMLAnchorElement) return source.href;
    return source.textContent;
  }

  /** Write explicit/source text and resolve with the copied string. */
  async copy(value = this.#sourceText(), {
    clipboard = globalThis.navigator?.clipboard,
  } = {}) {
    if (!clipboard?.writeText) throw new ReferenceError('Clipboard API is required');
    const text = String(value);
    await clipboard.writeText(text);
    this.dispatchEvent(new CustomEvent('copy', { detail: { value: text } }));
    return text;
  }
}

export const defineCopyButton = registry =>
  defineElement('copy-button', CopyButton, undefined, registry);
