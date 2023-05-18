import { EventEmitter } from './events.js';

const { geolocation } = navigator;

/**
 * Geolocation.getCurrentPosition()
 * @docs https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
 * @param {*} options 
 * @returns 
 */
export const getCurrentPosition = options => {
  if (!geolocation) Promise.reject('does not support geolocation');
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, reject, options);
  });
};

/**
 * Geolocation.watchPosition()
 * @docs https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
 * @param {*} fn 
 * @param {*} options 
 * @returns 
 */
export const watchPosition = (fn, options) => {
  var id;
  return {
    // @docs https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/clearWatch
    stop: geolocation.clearWatch(id),
    start: () => id = geolocation.watchPosition(fn.bind(null, null), fn, options),
  }
};

export const distance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const c = Math.cos;
  const p = Math.PI / 180;
  const deg2rad = deg => deg * p;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 0.5 - c(dLat) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c(dLon)) / 2;
  return (2 * R) * Math.asin(Math.sqrt(a));
};

export class LocationService extends EventEmitter {
  constructor(options) {
    super();
    Object.assign(this, {
      timeout: 5000,
      maximumAge: 0,
      enableHighAccuracy: true,
    }, options);
  }
  enable() {

  }
}

export const location = new LocationService();
export const requestLocation = getCurrentPosition;
