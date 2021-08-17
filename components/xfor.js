import { define, wrap } from '../webcomponent.js';

define('x-for', class extends wrap(HTMLElement) {
  mount() {
    const items = JSON.parse(this.getAttribute('items'));
    console.log(items);
  }
  renderShadow() {
    return `
      <p>
        <slot name="my-text">My default text</slot>
      </p>
    `;
  }
});
