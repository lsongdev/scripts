
class XSidebar extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
  }
}

customElements.define('x-sidebar', XSidebar);
