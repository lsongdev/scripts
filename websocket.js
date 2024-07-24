import { EventEmitter } from 'https://lsong.org/scripts/events.js';

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 */
export class SuperWebSocket extends EventEmitter {
  constructor(url, options = {}) {
    super();
    const { protocols = [] } = options;
    this.ws = new WebSocket(url, protocols);
    this.ws.onerror = e => this.emit('error', e);
    this.ws.onopen = e => this.emit('open', e);
    this.ws.onmessage = e => this.emit('message', e.data, e);
    this.ws.onclose = e => this.emit('close', e);
    this.body = createWebSocketStream(this.ws);
    this.ready = new Promise((resolve, reject) => {
      this.once("open", resolve);
      this.once("error", reject);
    });
    return this;
  }
  send(data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    this.ws.send(data);
  }
  close(code = 1000, reason) {
    this.ws.close(code, reason);
  }
  async getReader() {
    return this.body.getReader();
  }
}

export const connect = (url, opts) => new SuperWebSocket(url, opts);

export function createWebSocketStream(ws) {
  return new ReadableStream({
    start(controller) {
      ws.onmessage = (event) => {
        controller.enqueue(event.data);
      };
      ws.onerror = (error) => {
        controller.error(error);
      };
      ws.onclose = () => {
        controller.close();
      };
    },
    cancel() {
      ws.close();
    }
  });
}
