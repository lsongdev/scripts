import { define, wrap } from '../webcomponent.js';
import { format } from '../time.js';

const defaultFormat = `{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}`;

define('x-time', class extends wrap('time') {
  mount() {
    const f = this.getAttribute('format') || defaultFormat;
    this.textContent = format(f);
  }
}, { extends: 'time' });
