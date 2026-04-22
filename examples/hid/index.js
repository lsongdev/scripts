import { ready, addEventListener, querySelector as $ } from '../../dom.js';
import { listDevices, requestDevice } from '../../hid.js';

const select = selector => {
  const dom = $(selector);
  return {
    on(type, fn) {
      return addEventListener(dom, type, fn);
    },
    append(display, value) {
      const option = document.createElement('option');
      option.innerText = display;
      option.value = value;
      dom.appendChild(option);
    }
  };
};

ready(async () => {

  const list = select('#list');
  const devices = await listDevices();
  devices.forEach((device, i) => {
    list.append(device.productName, i);
  });

  let selectedDevice = devices[0];
  list.on('change', e => {
    const { value: index } = e.target;
    const device = devices[index];
    selectedDevice = device;
    console.log('selectedDevice:', selectedDevice);
  });

  addEventListener('#request', 'click', async () => {
    const devices = await requestDevice();
    devices.forEach(device => {
      console.log(`HID: ${device.productName}`);
    });
  });

  addEventListener('#open', 'click', async () => {
    if (!selectedDevice.opened)
      await selectedDevice.open();
    selectedDevice.oninputreport = e => {
      console.log('report', e.data);
      parseAndDisplayData(e.data);
    };
  });

  addEventListener('#close', 'click', async () => {
    selectedDevice.close();
  });

  const numberFormat = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2
  });

  // ambient light sensor
  function parseAndDisplayData(view) {
    const flag = view.getUint8();
    const v1 = view.getUint32(1, true) * 10 ** -2; // Light - no idea what value, Exponent is from HidReport
    const v2 = view.getUint32(5, true); // This is reported as Temperatur, no idea
    const v3 = view.getUint32(9, true); // No idea
    const v4 = view.getUint32(13, true); // No idea
    output.innerHTML = numberFormat.format(v1);
  }




  // navigator.hid.requestDevice
  // device.open()
  // device.oninputreport
  // const { data } = report
  // this.lastReport = data.buffer

});
