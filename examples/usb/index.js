import { on, ready } from '../../dom/events.js';
import { $ } from '../../dom/query.js';

ready(async () => {
  on($('#list'), 'click', async () => {
    const devices = await navigator.usb.getDevices();
    console.log(devices);
  });

  on($('#request'), 'click', async () => {
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x2341 }],
    });
  });
});
