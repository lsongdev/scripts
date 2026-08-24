function peerConstructor(value) {
  if (typeof value !== 'function') throw new ReferenceError('RTCPeerConnection is required');
  return value;
}

/** Construct and return a native RTCPeerConnection with caller-owned configuration. */
export function createPeerConnection(configuration, {
  RTCPeerConnection: PeerConnection = globalThis.RTCPeerConnection,
} = {}) {
  return new (peerConstructor(PeerConnection))(configuration);
}

export async function createOffer(connection, options, { signal } = {}) {
  signal?.throwIfAborted();
  const description = await connection.createOffer(options);
  signal?.throwIfAborted();
  await connection.setLocalDescription(description);
  return connection.localDescription;
}

export async function createAnswer(connection, options, { signal } = {}) {
  signal?.throwIfAborted();
  const description = await connection.createAnswer(options);
  signal?.throwIfAborted();
  await connection.setLocalDescription(description);
  return connection.localDescription;
}
