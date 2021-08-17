import { EventEmitter } from './events.js';

export class Gyroscope extends EventEmitter {
  constructor() {
    super();
    // @deprecated This feature is no longer recommended.
    // @docs https://developer.mozilla.org/en-US/docs/Web/API/Window/orientationchange_event
    // window.addEventListener('orientationchange', this.handleOrientation, true);
    this.mql = window.matchMedia("(orientation: portrait)");
    this.mql.addEventListener('change', this.handleOrientation);
    // @docs https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event
    window.addEventListener('deviceorientation', this.handleChange, true);
  }
  get orientation() {
    return this.mql.matches ? "portrait" : "landscape";
  }
  get portrait() {
    return this.orientation === "portrait";
  }
  get landscape() {
    return this.orientation === "landscape";
  }
  enable() {
    if (!('DeviceOrientationEvent' in window))
      return Promise.reject(new Error('DeviceOrientationEvent not supported'));
    const {
      requestPermission = (() => Promise.resolve('granted'))
    } = DeviceOrientationEvent;
    return requestPermission();
  }
  handleChange = ({ absolute, alpha: z, beta: y, gamma: x }) => {
    this.emit('change', { x, y, z, absolute });
  }
  handleOrientation = () => {
    this.emit('orientation', this.orientation);
  }
}

export const gyroscope = new Gyroscope();
export const request = () => gyroscope.enable();
export const orientation = fn => gyroscope.addListener('change', fn);
