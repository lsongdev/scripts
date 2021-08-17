import EventEmitter from "./events.js";

const { hid } = navigator;

export const listDevices = () => {
  return hid.getDevices();
};

export const requestDevice = (filters = []) => {
  return hid.requestDevice({ filters });
};

export class HumanInterfaceDevice extends EventEmitter {

}
