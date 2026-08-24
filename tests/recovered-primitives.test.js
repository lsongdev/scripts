import assert from 'node:assert/strict';
import test from 'node:test';

import { throttle } from '../async/throttle.js';
import { bytesToHex, hexToBytes } from '../encoding/hex.js';
import { createAnswer, createOffer, createPeerConnection } from '../net/webrtc.js';

test('hex codec round-trips bytes and rejects malformed text', () => {
  assert.equal(bytesToHex(new Uint8Array([0, 15, 255])), '000fff');
  assert.deepEqual(hexToBytes('000Fff'), new Uint8Array([0, 15, 255]));
  assert.throws(() => hexToBytes('abc'), SyntaxError);
});

test('throttle preserves the receiver and latest trailing call', async () => {
  const values = [];
  const target = { value: 4, run: throttle(function (input) { values.push(this.value + input); }, 10) };
  target.run(1);
  target.run(2);
  target.run.flush();
  assert.deepEqual(values, [5, 6]);
});

test('WebRTC helpers preserve native connection and descriptions', async () => {
  class FakePeerConnection {
    constructor(configuration) { this.configuration = configuration; }
    async createOffer() { return { type: 'offer', sdp: 'offer' }; }
    async createAnswer() { return { type: 'answer', sdp: 'answer' }; }
    async setLocalDescription(value) { this.localDescription = value; }
  }
  const connection = createPeerConnection({ iceServers: [] }, { RTCPeerConnection: FakePeerConnection });
  assert.deepEqual(await createOffer(connection), { type: 'offer', sdp: 'offer' });
  assert.deepEqual(await createAnswer(connection), { type: 'answer', sdp: 'answer' });
});
