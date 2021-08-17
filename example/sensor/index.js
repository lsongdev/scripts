import { ready } from '../../dom.js';
import { gyroscope } from '../../motion.js';

ready(() => {
  const start = document.getElementById('start');
  const output = document.getElementById('output');
  start.addEventListener('click', async () => gyroscope.enable());
  gyroscope.addListener('orientation', e => {
    console.log(e);
  });
  gyroscope.addListener('change', e => {
    output.innerHTML = '';
    output.innerHTML += "absolute: " + e.absolute + "\n";
    output.innerHTML += "beta(x): " + e.x + "\n";
    output.innerHTML += "gamma(y): " + e.y + "\n";
    output.innerHTML += "alpha(z): " + e.z + "\n";
  });
});
