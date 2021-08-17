import EventEmitter from "./events.js";

// https://developers.google.com/web/updates/2016/03/access-usb-devices-on-the-web

const { usb } = navigator;

export const listDevices = () => {
  return usb.getDevices();
}

export const requestDevice = (filters = []) => {
  if (!Array.isArray(filters)) filters = [filters];
  return usb.requestDevice({ filters });
};

export const connect = async (vendorId, productId) => {
  const device = await requestDevice({ vendorId, productId });
  await device.open();
  return device;
};

export class USB extends EventEmitter {
  open() {

  }
}
