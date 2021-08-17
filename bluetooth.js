import EventEmitter from "./events.js";

const { bluetooth } = navigator;

export const requestDevice = options => {
  return bluetooth.requestDevice(options);
};

export class Bluetooth extends EventEmitter {
  open() {
    
  }
}
