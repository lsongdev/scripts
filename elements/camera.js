import { requestCamera, stopMediaStream } from '../media/capture.js';
import { attachMediaStream, playMedia } from '../media/video.js';
import { defineElement } from './define.js';

export class CameraView extends HTMLElement {
  #detach;
  #lifecycle;
  #stream;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:block}video{display:block;width:100%;height:100%;object-fit:cover}';
    const video = document.createElement('video');
    video.autoplay = false;
    video.muted = true;
    video.playsInline = true;
    root.append(style, video);
  }

  disconnectedCallback() {
    this.stop();
  }

  get stream() {
    return this.#stream;
  }

  get video() {
    return this.shadowRoot.querySelector('video');
  }

  /** Request permission on explicit invocation and return the native stream. */
  async start({
    audio = false,
    navigator: target = globalThis.navigator,
    play = true,
    signal,
    video = true,
  } = {}) {
    this.stop();
    signal?.throwIfAborted();
    this.#lifecycle = new AbortController();
    const lifecycleSignal = signal
      ? AbortSignal.any([signal, this.#lifecycle.signal])
      : this.#lifecycle.signal;
    const stream = await requestCamera({ audio, navigator: target, video });
    if (lifecycleSignal.aborted || !this.isConnected) {
      stopMediaStream(stream);
      lifecycleSignal.throwIfAborted();
      throw new DOMException('Camera view is disconnected', 'AbortError');
    }

    this.#stream = stream;
    this.#detach = attachMediaStream(this.video, stream, {
      muted: true,
      signal: lifecycleSignal,
    });
    if (play) await playMedia(this.video, { signal: lifecycleSignal });
    this.dispatchEvent(new CustomEvent('camerastart', { detail: { stream } }));
    return stream;
  }

  stop() {
    this.#lifecycle?.abort(new DOMException('Camera stopped', 'AbortError'));
    this.#lifecycle = undefined;
    this.video.pause();
    this.#detach?.();
    this.#detach = undefined;
    if (this.#stream) stopMediaStream(this.#stream);
    this.#stream = undefined;
  }
}

export const defineCamera = registry =>
  defineElement('camera-view', CameraView, undefined, registry);
