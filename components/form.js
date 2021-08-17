import { define, wrap } from '../webcomponent.js';
import { serialize } from '../form.js';

define('x-form', class extends wrap(HTMLFormElement) {
  handleSubmit(e) {
    e.preventDefault();
    const { method, action: url, enctype } = this;
    const data = serialize(this);
    console.log('submit', method, url, enctype, data);
  }
  mount() {
    this.addEventListener('submit', this.handleSubmit);
  }
}, { extends: 'form' });
