function getGeolocation(target) {
  const geolocation = target?.geolocation;
  if (!geolocation) throw new ReferenceError('Geolocation is required');
  return geolocation;
}

/** Promisify the standard callback-based getCurrentPosition API. */
export function getCurrentPosition(options, {
  navigator: target = globalThis.navigator,
} = {}) {
  const geolocation = getGeolocation(target);
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Watch positions and return a disposer. AbortSignal provides shared lifecycle
 * control without introducing a service object.
 */
export function watchPosition(onPosition, {
  onError,
  options,
  signal,
  navigator: target = globalThis.navigator,
} = {}) {
  if (typeof onPosition !== 'function') {
    throw new TypeError('onPosition must be a function');
  }
  signal?.throwIfAborted();
  const geolocation = getGeolocation(target);
  const id = geolocation.watchPosition(onPosition, onError, options);
  let active = true;
  const stop = () => {
    if (!active) return;
    active = false;
    geolocation.clearWatch(id);
    signal?.removeEventListener('abort', stop);
  };
  signal?.addEventListener('abort', stop, { once: true });
  return stop;
}

/** Calculate great-circle distance in metres between coordinate-like objects. */
export function distance(first, second, { radius = 6_371_000 } = {}) {
  const toRadians = degrees => degrees * Math.PI / 180;
  const latitude = toRadians(second.latitude - first.latitude);
  const longitude = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const a = Math.sin(latitude / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude)
    * Math.sin(longitude / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
