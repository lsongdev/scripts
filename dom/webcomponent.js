import { createTemplate } from './dom.js';

export const define = (name, ctor, options) => {
  if (customElements.get(name)) {
    const elements = document.querySelectorAll(name);
    for (const element of elements) {
      if (element instanceof ctor) continue;
      // https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/upgrade
      customElements.upgrade(element);
    }
  } else {
    customElements.define(name, ctor, options);
  }
};
/**
 * wrap
 * @param {*} base 
 * @returns 
 * @example
 * 
 * class MyComponent extends wrap() {}
 */
export const wrap = (base = HTMLElement) => {
  if (typeof base === 'string') {
    const elem = document.createElement(base);
    base = elem.constructor;
  }
  return class extends base {
    async connectedCallback() {
      await this.create();
      await this.mount();
    }
    mount() { }
    async create() {
      if (!(typeof this.render === 'function'))
        return;
      const html = await this.render();
      if (!html) return;
      const templateContent = createTemplate(html);
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(templateContent.cloneNode(true));
      return this;
    }
  }
};
