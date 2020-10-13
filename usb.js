// https://developers.google.com/web/updates/2016/03/access-usb-devices-on-the-web

export const listDevices = () => {
  return navigator.usb.getDevices();
}

export const requestDevice = (filters = []) => {
  if (!Array.isArray(filters)) filters = [filters];
  return navigator.usb.requestDevice({ filters });
};

export const connect = async (vendorId, productId) => {
  const device = await requestDevice({ vendorId, productId });
  await device.open();
  return device;
};
