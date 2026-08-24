/** Request device-orientation permission where the platform requires it. */
export async function requestOrientationPermission({
  DeviceOrientationEvent: API = globalThis.DeviceOrientationEvent,
} = {}) {
  if (!API) throw new ReferenceError('DeviceOrientationEvent is required');
  const permission = typeof API.requestPermission === 'function'
    ? await API.requestPermission()
    : 'granted';
  if (permission !== 'granted') {
    throw new DOMException('Device orientation permission was not granted', 'NotAllowedError');
  }
  return permission;
}

/** Observe native DeviceOrientationEvents and return an idempotent disposer. */
export function observeOrientation(listener, {
  signal,
  window: target = globalThis.window,
} = {}) {
  if (!target) throw new ReferenceError('Window is required');
  if (typeof listener !== 'function') throw new TypeError('listener must be a function');
  signal?.throwIfAborted();
  target.addEventListener('deviceorientation', listener, { signal });
  return () => target.removeEventListener('deviceorientation', listener);
}

/** Observe portrait/landscape changes through the standard matchMedia query. */
export function observeViewportOrientation(listener, {
  signal,
  window: target = globalThis.window,
} = {}) {
  if (!target) throw new ReferenceError('Window is required');
  if (typeof listener !== 'function') throw new TypeError('listener must be a function');
  signal?.throwIfAborted();
  const query = target.matchMedia('(orientation: portrait)');
  const notify = event => listener(event.matches ? 'portrait' : 'landscape', event);
  query.addEventListener('change', notify, { signal });
  const dispose = () => query.removeEventListener('change', notify);
  return Object.freeze({
    dispose,
    orientation: query.matches ? 'portrait' : 'landscape',
    query,
  });
}
