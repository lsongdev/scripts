
export const listDevices = () => {
  return navigator.usb.getDevices();
}

export const requestDevice = (filters = []) => {
  if (!Array.isArray(filters)) filters = [filters];
  navigator.usb.requestDevice({ filters });
};
