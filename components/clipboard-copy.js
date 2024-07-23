import { copy as copyText } from '../clipboard.js';

function copyTarget(content) {
  if (content instanceof HTMLInputElement || content instanceof HTMLTextAreaElement) {
    return copyText(content.value)
  } else if (content instanceof HTMLAnchorElement && content.hasAttribute('href')) {
    return copyText(content.href)
  } else {
    return copyNode(content)
  }
}

class CopyButton extends HTMLButtonElement {
  constructor() {
    super();
    this.addEventListener('click', async () => {
      const id = this.getAttribute('for');
      const text = this.getAttribute('value') || document.getElementById(id).value;
      await copyText(text);
    });
  }
}

customElements.define('x-copy', CopyButton, { extends: 'button' })
