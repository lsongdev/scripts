import { addEventListener } from './dom.js';

export const accelerometer = (options = { frequency: 60 }, cb) => {
  const acl = new Accelerometer(options);
  acl.addEventListener('reading', () => cb(acl));
  return acl;
};

export const orientation = cb => {
  return addEventListener(window, 'deviceorientation', cb, true);
};
