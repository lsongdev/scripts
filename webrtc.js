
export const RTCPeerConnection =
  window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection;

export const RTCIceCandidate =
  window.RTCIceCandidate ||
  window.mozRTCIceCandidate ||
  window.webkitRTCIceCandidate;

export const RTCSessionDescription =
  window.RTCSessionDescription ||
  window.mozRTCSessionDescription ||
  window.webkitRTCSessionDescription;

export const DefaultPeerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

export class WebRTC {
  constructor(configuration = DefaultPeerConnectionConfig) {
    this.peerConnection = new RTCPeerConnection(configuration);
  }
  addEventListener(name, handler) {
    this.peerConnection.addEventListener(name, handler);
    return this;
  }
  removeEventListener(name, handler) {
    this.peerConnection.removeEventListener(name, handler);
    return this;
  }
  getPeerConnection() {
    return this.peerConnection;
  }
  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }
  async createAnswer() {
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }
}
