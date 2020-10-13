
export const getUserMedia =
  navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) ||
  navigator.webkitGetUserMedia.bind(navigator) ||
  navigator.mozGetUserMedia.bind(navigator);

export const getDisplayMedia =
  navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);

export const requestCamera = ({ microphone: audio = false, ...video } = {}) => {
  return getUserMedia({ audio, video });
};

export const requestMicrophone = () => {
  return getUserMedia({ audio: true });
};

export const requestDisplay = displayMediaOptions => {
  return getDisplayMedia(displayMediaOptions);
};
