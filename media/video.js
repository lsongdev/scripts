/** Attach a standard MediaStream and return an idempotent detach operation. */
export function attachMediaStream(media, stream, {
  muted,
  signal,
  stopTracks = false,
} = {}) {
  signal?.throwIfAborted();
  if (!(stream instanceof MediaStream)) throw new TypeError('Expected a MediaStream');
  const previousStream = media.srcObject;
  const previousMuted = media.muted;
  let attached = true;
  media.srcObject = stream;
  if (muted !== undefined) media.muted = Boolean(muted);

  const detach = () => {
    if (!attached) return;
    attached = false;
    signal?.removeEventListener('abort', detach);
    if (media.srcObject === stream) media.srcObject = previousStream;
    if (muted !== undefined) media.muted = previousMuted;
    if (stopTracks) {
      for (const track of stream.getTracks()) track.stop();
    }
  };
  signal?.addEventListener('abort', detach, { once: true });
  return detach;
}

/** Start native media playback and pause it when the owning signal aborts. */
export async function playMedia(media, { signal } = {}) {
  signal?.throwIfAborted();
  const pause = () => media.pause();
  signal?.addEventListener('abort', pause, { once: true });
  try {
    await media.play();
    return media;
  } catch (error) {
    signal?.removeEventListener('abort', pause);
    throw error;
  }
}
