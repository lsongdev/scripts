function getMediaDevices(target) {
  const devices = target?.mediaDevices;
  if (!devices) throw new ReferenceError('MediaDevices is required');
  return devices;
}

/** List media devices using the standard MediaDevices API. */
export function listDevices({ navigator: target = globalThis.navigator } = {}) {
  return getMediaDevices(target).enumerateDevices();
}

/** Request a camera MediaStream. The caller owns and must stop its tracks. */
export function requestCamera({
  audio = false,
  video = true,
  navigator: target = globalThis.navigator,
} = {}) {
  return getMediaDevices(target).getUserMedia({ audio, video });
}

/** Request a microphone MediaStream. The caller owns and must stop its tracks. */
export function requestMicrophone({
  audio = true,
  navigator: target = globalThis.navigator,
} = {}) {
  return getMediaDevices(target).getUserMedia({ audio, video: false });
}

/** Request a display MediaStream. The caller owns and must stop its tracks. */
export function requestDisplay({
  audio = false,
  video = true,
  navigator: target = globalThis.navigator,
} = {}) {
  const devices = getMediaDevices(target);
  if (typeof devices.getDisplayMedia !== 'function') {
    throw new ReferenceError('MediaDevices.getDisplayMedia is required');
  }
  return devices.getDisplayMedia({ audio, video });
}

/** Stop every track in a MediaStream. */
export function stopMediaStream(stream) {
  for (const track of stream.getTracks()) track.stop();
}
