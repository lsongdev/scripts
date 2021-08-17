import { requestCamera } from '../media.js';

class CameraView extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `
      <style>
      video{
        width: 100%;
        height: 100%;
      }
      </style>
      <video></video>
    `;
    const video = this.querySelector('video');
    const camera = await requestCamera({ microphonoe: false });
    video.srcObject = camera;
    video.onloadedmetadata = () => video.play();
  }
}

customElements.define("camera-view", CameraView);
