
const { mediaDevices } = navigator;

export const listDevices = () => mediaDevices.enumerateDevices();

export const getUserMedia = constraints => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    return navigator.mediaDevices.getUserMedia(constraints);
  var GET_USER_MEDIA = 'getUserMedia';
  return new Promise((resolve, reject) => {
    if ('webkitGetUserMedia' in navigator) {
      GET_USER_MEDIA = 'webkitGetUserMedia';
    }
    if ('mozGetUserMedia' in navigator) {
      GET_USER_MEDIA = 'mozGetUserMedia';
    }
    navigator[GET_USER_MEDIA](constraints, resolve, reject);
  });
};

export const getDisplayMedia = options => {
  if (!('getDisplayMedia' in navigator.mediaDevices))
    return Promise.reject('not supported');
  return navigator.mediaDevices.getDisplayMedia(options);
};

export const requestCamera = ({ microphone: audio = false, ...video } = {}) => {
  return getUserMedia({ audio, video });
};

export const requestMicrophone = () => {
  return getUserMedia({ audio: true });
};

export const requestDisplay = displayMediaOptions => {
  return getDisplayMedia(displayMediaOptions);
};

export const setMediaInfo = info => {
  if (!("mediaSession" in navigator)) return;
  const metadata = new MediaMetadata(info);
  navigator.mediaSession.metadata = metadata;
  return metadata;
};

export const syncPlaybackState = state => {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = state;
  return state;
};

export const setActionHandler = (type, callback) => {
  if (!("mediaSession" in navigator)) return;
  return navigator.mediaSession.setActionHandler(type, callback);
};

export const setCameraActive = active => {
  if (!("mediaSession" in navigator)) return;
  return navigator.mediaSession.setCameraActive(active);
};

export const setMicrophoneActive = active => {
  if (!("mediaSession" in navigator)) return;
  return navigator.mediaSession.setMicrophoneActive(active);
};

export const setPositionState = state => {
  if (!("mediaSession" in navigator)) return;
  return navigator.mediaSession.setPositionState(state);
};


