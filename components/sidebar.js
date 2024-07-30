class XSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }
  get hidden() {
    return this.hasAttribute('hidden');
  }
  set hidden(value) {
    if (value) {
      this.setAttribute('hidden', '');
    } else {
      this.removeAttribute('hidden');
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          top: 0;
          left: 0;
          bottom: 0;
          display: block;
          position: fixed;
          transition: .5s ease-in-out;
          box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
          // box-shadow: inset -.5px 0 10px 0px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(12px) saturate(1.25);
          width: var(--sidebar-width, 250px);
          min-width: var(--sidebar-width, 250px);
          overflow: hidden;
        }
        :host([hidden]) {
          width: 0;
          min-width: 0;
        }
        .sidebar {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: var(--sidebar-width, 250px);
        }
        .sidebar-header,
        .sidebar-footer {
          text-align: center;
        }
        .sidebar-footer {
          padding: 20px;
        }
        .sidebar-content {
          flex: 1 1 auto;
          overflow-x: hidden;
          overflow-y: auto;
        }
      </style>
      <aside class="sidebar">
        <div class="sidebar-header">
          <slot name="sidebar-header"></slot>
          <!--// <div><button>☰</button></div> -->
        </div>
        <div class="sidebar-content">
          <slot name="sidebar-content"></slot>
        </div>
        <div class="sidebar-footer">
          <slot name="sidebar-footer"></slot>
        </div>
      </aside>
    `;
  }
}

customElements.define('x-sidebar', XSidebar);
