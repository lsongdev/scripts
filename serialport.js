import { EventEmitter } from './events.js';

export class SerialPort extends EventEmitter {
  constructor(port, options) {
    this.port = port;
    this.options = options;
  }
  async open() {
    const { baudRate } = this.options;
    await port.open({ baudRate });
  }
}

export const requestPort = () => new Promise((resolve, reject) => {
  if (!navigator.serial) reject();
  return navigator.serial.requestPort().then(resolve, reject);
});

export const connect = async ({ baudRate = 9600 } = {}) => {
  const port = await requestPort();
  await port.open({ baudRate });
  return port;
};
