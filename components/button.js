import './icon.js';

class XButton extends HTMLButtonElement {
  static get observedAttributes() {
    return ['icon', 'loading'];
  }

  connectedCallback() {
    this.updateIcon();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (['icon', 'loading'].includes(name)) {
      this.updateIcon();
    }
  }

  updateIcon() {
    const loading = this.hasAttribute('loading');
    const icon = loading ? 'mdi:loading' : this.getAttribute('icon');
    if (icon) {
      this.iconElement = this.iconElement || this.insertBefore(document.createElement('x-icon'), this.firstChild);
      this.iconElement.setAttribute('icon', icon);
      if (loading) this.iconElement.classList.add('loading-icon');
      else this.iconElement.classList.remove('loading-icon');
    } else if (this.iconElement) {
      this.removeChild(this.iconElement);
      this.iconElement = null;
    }
  }
}

customElements.define('x-button', XButton, { extends: 'button' });
