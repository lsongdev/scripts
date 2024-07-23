
export class Icon extends HTMLElement {
  static get observedAttributes() {
    return ['icon']; // Observe the 'icon' attribute for changes
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // Attach shadow root with open mode
    this.icon = this.getAttribute('icon') || '';
  }

  connectedCallback() {
    this.loadIcon();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'icon' && oldValue !== newValue) {
      this.icon = newValue;
      this.loadIcon();
    }
  }

  loadIcon() {
    if (this.icon) {
      const src = `https://api.iconify.design/${this.icon}.svg`;
      fetch(src)
        .then((response) => {
          if (response.ok) return response.text();
          else throw new Error('Icon not found');
        })
        .then((svg) => {
          this.shadowRoot.innerHTML = svg;
        })
        .catch((error) => {
          console.error('Error loading icon:', error);
          this.shadowRoot.innerHTML = '<span>Error loading icon.</span>';
        });
    }
  }
}

customElements.define('x-icon', Icon);
