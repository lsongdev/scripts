import { on, ready } from '../../dom/events.js';
import { $ } from '../../dom/query.js';
import { openPort } from '../../devices/serial.js';

ready(async () => {
  on($('#connect'), 'click', async () => {
    const port = await openPort();
    console.log(port);
  });

});
