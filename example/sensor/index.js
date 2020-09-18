import { ready, querySelector as $, addEventListener as on } from '../../dom.js';
import { accelerometer } from '../../sensor.js';

ready(() => {
  const acl = accelerometer({}, acl => {
    $('#x').textContent = acl.x;
    $('#y').textContent = acl.y;
    $('#z').textContent = acl.z;
  });
  on('#accelerometer_start', 'click', () => {
    acl.start();
  });
});
