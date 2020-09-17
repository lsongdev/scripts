
export const requestDevice = options => {
  return navigator.bluetooth.requestDevice(options);
};
