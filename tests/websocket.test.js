import assert from 'node:assert/strict';
import test from 'node:test';

import { connect, createMessageStream } from '../net/websocket.js';

class TestWebSocket extends EventTarget {
  static last;

  constructor(url, protocols) {
    super();
    this.url = url;
    this.protocols = protocols;
    this.closed = false;
    TestWebSocket.last = this;
  }

  close(code, reason) {
    this.closed = true;
    this.closeInfo = { code, reason };
    this.dispatchEvent(new Event('close'));
  }
}

test('connect resolves with the standard socket and AbortSignal closes it', async () => {
  const controller = new AbortController();
  const pending = connect('wss://example.test', {
    protocols: ['chat'],
    signal: controller.signal,
    WebSocket: TestWebSocket,
  });
  const socket = TestWebSocket.last;
  socket.dispatchEvent(new Event('open'));

  assert.equal(await pending, socket);
  assert.deepEqual(socket.protocols, ['chat']);
  controller.abort();
  assert.equal(socket.closed, true);
  assert.deepEqual(socket.closeInfo, { code: 1000, reason: 'Aborted' });
});

test('connect rejects with the AbortSignal reason while opening', async () => {
  const controller = new AbortController();
  const pending = connect('wss://example.test', {
    signal: controller.signal,
    WebSocket: TestWebSocket,
  });
  controller.abort(new Error('stop'));
  await assert.rejects(pending, error => error === controller.signal.reason);
});

test('createMessageStream preserves MessageEvent objects', async () => {
  const socket = new TestWebSocket('wss://example.test');
  const stream = createMessageStream(socket);
  const reader = stream.getReader();
  const event = new Event('message');
  Object.defineProperty(event, 'data', { value: 'hello' });
  socket.dispatchEvent(event);

  const result = await reader.read();
  assert.equal(result.value, event);
  assert.equal(result.value.data, 'hello');
  await reader.cancel();
  reader.releaseLock();
  assert.equal(socket.closed, false);
});
