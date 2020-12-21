import { ready } from '../../dom.js';
import { requestDevice } from '../../hid.js';

ready(async () => {
  const device = await requestDevice();
  console.log(device);
});
