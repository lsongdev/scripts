
export const requestPort = () => new Promise((resolve, reject) => {
  if (!navigator.serial) reject();
  return navigator.serial.requestPort().then(resolve, reject);
});

export const connect = async ({ baudRate = 9600 } = {}) => {
  const port = await requestPort();
  await port.open({ baudRate });
  return port;
};
