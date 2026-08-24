import { on, ready } from '../../dom/events.js';
import { $ } from '../../dom/query.js';

const select = selector => {
  const dom = $(selector);
  return {
    on(type, fn) {
      return on(dom, type, fn);
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
  let devices = [];

  let selectedDevice = null;
  on($('#paired'), 'click', async () => {
    devices = await navigator.hid.getDevices();
    $('#list').replaceChildren();
    devices.forEach((device, index) => list.append(device.productName, index));
    selectedDevice = devices[0] ?? null;
  });
  list.on('change', e => {
    const { value: index } = e.target;
    const device = devices[index];
    selectedDevice = device;
    console.log('selectedDevice:', selectedDevice);
  });

  on($('#request'), 'click', async () => {
    const devices = await navigator.hid.requestDevice({ filters: [] });
    devices.forEach(device => {
      console.log(`HID: ${device.productName}`);
    });
  });

  on($('#open'), 'click', async () => {
    if (!selectedDevice) return;
    if (!selectedDevice.opened)
      await selectedDevice.open();
    selectedDevice.oninputreport = e => {
      console.log('report', e.data);
      parseAndDisplayData(e.data);
    };
  });

  on($('#close'), 'click', async () => {
    await selectedDevice?.close();
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
