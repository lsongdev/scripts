function mediaSession(target) {
  if (!target?.mediaSession) throw new ReferenceError('MediaSession is required');
  return target.mediaSession;
}

export function setMediaMetadata(value, {
  MediaMetadata: Metadata = globalThis.MediaMetadata,
  navigator: target = globalThis.navigator,
} = {}) {
  if (!Metadata) throw new ReferenceError('MediaMetadata is required');
  const metadata = value instanceof Metadata ? value : new Metadata(value);
  mediaSession(target).metadata = metadata;
  return metadata;
}

export function setPlaybackState(state, { navigator: target = globalThis.navigator } = {}) {
  mediaSession(target).playbackState = state;
  return state;
}

export function setMediaActionHandler(action, handler, {
  navigator: target = globalThis.navigator,
} = {}) {
  mediaSession(target).setActionHandler(action, handler);
  return handler;
}

export function setMediaPositionState(state, {
  navigator: target = globalThis.navigator,
} = {}) {
  mediaSession(target).setPositionState(state);
  return state;
}

export function setCameraActive(active, { navigator: target = globalThis.navigator } = {}) {
  const session = mediaSession(target);
  if (typeof session.setCameraActive !== 'function') {
    throw new ReferenceError('MediaSession.setCameraActive is required');
  }
  return session.setCameraActive(Boolean(active));
}

export function setMicrophoneActive(active, { navigator: target = globalThis.navigator } = {}) {
  const session = mediaSession(target);
  if (typeof session.setMicrophoneActive !== 'function') {
    throw new ReferenceError('MediaSession.setMicrophoneActive is required');
  }
  return session.setMicrophoneActive(Boolean(active));
}
