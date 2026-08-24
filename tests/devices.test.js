import assert from 'node:assert/strict';
import test from 'node:test';

import {
  distance,
  getCurrentPosition,
  watchPosition,
} from '../devices/geolocation.js';
import { openPort, requestPort } from '../devices/serial.js';

test('getCurrentPosition resolves the standard GeolocationPosition', async () => {
  const position = { coords: { latitude: 1, longitude: 2 } };
  const navigator = {
    geolocation: {
      getCurrentPosition(resolve) {
        resolve(position);
      },
    },
  };
  assert.equal(await getCurrentPosition({}, { navigator }), position);
});

test('watchPosition returns a disposer and honors AbortSignal', () => {
  const cleared = [];
  const navigator = {
    geolocation: {
      clearWatch(id) {
        cleared.push(id);
      },
      watchPosition() {
        return 42;
      },
    },
  };
  const controller = new AbortController();
  const stop = watchPosition(() => {}, { navigator, signal: controller.signal });
  stop();
  controller.abort();
  assert.deepEqual(cleared, [42]);
});

test('distance returns metres between coordinate-like objects', () => {
  const result = distance(
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
  );
  assert.ok(result > 111_000 && result < 112_000);
});

test('serial helpers return the standard requested port', async () => {
  const calls = [];
  const port = {
    async open(options) {
      calls.push(['open', options]);
    },
  };
  const navigator = {
    serial: {
      async requestPort(options) {
        calls.push(['request', options]);
        return port;
      },
    },
  };

  assert.equal(await requestPort({ filters: [] }, { navigator }), port);
  assert.equal(await openPort({
    request: { filters: [{ usbVendorId: 1 }] },
    open: { baudRate: 115200 },
    navigator,
  }), port);
  assert.deepEqual(calls, [
    ['request', { filters: [] }],
    ['request', { filters: [{ usbVendorId: 1 }] }],
    ['open', { baudRate: 115200 }],
  ]);
});
