import { ready, addEventListener } from '../../dom.js';
import { listDevices, requestDevice } from '../../usb.js';

ready(async () => {
  addEventListener('#list', 'click', async () => {
    const devices = await listDevices();
    console.log(devices);
  });

  addEventListener('#request', 'click', async () => {
    const device = await requestDevice({ vendorId: 0x2341 });
  });
});
