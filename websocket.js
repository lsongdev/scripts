import EventEmitter from './events.js';

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 */
class Socket extends EventEmitter {
  constructor(url, options) {
    const { protocols = [] } = options;
    this.ws = new WebSocket(url, protocols);
    this.ws.onerror = e => this.emit('error', e);
    this.ws.onopen = e => this.emit('open', e);
    this.ws.onmessage = e => this.emit('message', e);
    this.ws.onclose = e => this.emit('close', e);
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
}

export default Socket;
