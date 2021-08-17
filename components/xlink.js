import { define, wrap } from '../webcomponent.js';

define('x-link', class extends wrap(HTMLAnchorElement) {
  handleClick(e) {
    if (this.hasAttribute('method')) {
      e.preventDefault();
      const { href } = this;
      const method = this.getAttribute('method');
      fetch(href, { method });
    }
  }
  mount() {
    this.addEventListener('click', this.handleClick);
  }
}, { extends: 'a' });
