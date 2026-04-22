import { querySelector as $ } from '../../dom.js';
import { listDevices } from '../../media.js';

const devices = await listDevices();

const videoinputs = devices.filter(x => x.kind == 'videoinput');
const audioinputs = devices.filter(x => x.kind == 'audioinput');
const audiooutputs = devices.filter(x => x.kind == 'audiooutput');

const $videoinputs = $('#videoinputs');
const $audioinputs = $('#audioinputs');
const $audiooutputs = $('#audiooutputs');

const appendToSelect = (dom, device) => {
  const option = document.createElement('option');
  option.value = device.deviceId;
  option.textContent = device.label;
  dom.appendChild(option);
  return option;
};

audioinputs.forEach(x => appendToSelect($audioinputs, x));
audiooutputs.forEach(x => appendToSelect($audiooutputs, x));
videoinputs.forEach(x => appendToSelect($videoinputs, x));
