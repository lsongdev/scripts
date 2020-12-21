// navigator.hid.requestDevice
// device.open()
// device.oninputreport
// const { data } = report
// this.lastReport = data.buffer

export const requestDevice = (filters = []) => {
  return navigator.hid.requestDevice({ filters });
};
