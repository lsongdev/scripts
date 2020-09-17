import { ready, addEventListener as on, querySelector as $ } from '../../dom.js';
import { KEY_CODES } from '../../keyboard.js';
import { format } from '../../date.js';

ready(() => {
  on('#form', 'submit', e => {
    e.preventDefault();
    const { value } = $('#format');
    const date = new Date;
    display.textContent = format(value, date);
  });
});
