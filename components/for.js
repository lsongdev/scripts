import { define, wrap } from '../webcomponent.js';

define('x-for', class extends wrap(HTMLElement) {
  static get observedAttributes() {
    return ['items'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'items' && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const items = JSON.parse(this.getAttribute('items') || '[]');
    this.shadowRoot.innerHTML = this.renderShadow(); // Render the static parts

    const templateContent = this.querySelector('template')?.content;
    if (templateContent) {
      const list = document.createElement('ul');
      items.forEach(item => {
        const templateClone = document.importNode(templateContent, true);
        this.processTemplate(templateClone, item);
        list.appendChild(templateClone);
      });
      this.shadowRoot.appendChild(list);
    }
  }

  processTemplate(template, item) {
    // Assuming item is an object with a 'name' property
    template.querySelectorAll('[data-template]').forEach(element => {
      const key = element.getAttribute('data-template');
      if (item[key] !== undefined) {
        element.textContent = item[key];
      }
    });
  }

  renderShadow() {
    return ``;
  }
});
