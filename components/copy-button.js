import { copy as copyText } from '../clipboard.js';

function copyNode(node) {
  const selection = window.getSelection();
  const range = document.createRange();
  selection.removeAllRanges();
  range.selectNodeContents(node);
  selection.addRange(range);
  document.execCommand('copy');
  selection.removeAllRanges();
}

function copyTarget(element) {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return copyText(element.value);
  } else if (element instanceof HTMLAnchorElement && element.hasAttribute('href')) {
    return copyText(element.href);
  } else {
    return copyNode(element);
  }
}

class CopyButton extends HTMLButtonElement {
  constructor() {
    super();
    this.addEventListener('click', this.handleClick);
  }

  async handleClick() {
    const id = this.getAttribute('for');
    const value = this.getAttribute('value');
    if (value) {
      await copyText(value);
      return;
    }
    if (!id) {
      console.error('CopyButton requires either "for" or "value" attribute');
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      await copyTarget(target);
    } else {
      console.error(`Element with id "${id}" not found`);
      return;
    }
  }

  connectedCallback() {
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', 'Copy to clipboard');
    }
  }
}

customElements.define('x-copy', CopyButton, { extends: 'button' });
