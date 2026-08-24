import assert from 'node:assert/strict';
import test from 'node:test';

import {
  listDevices,
  requestCamera,
  requestDisplay,
  requestMicrophone,
  stopMediaStream,
} from '../media/capture.js';

const createNavigator = () => {
  const calls = [];
  return {
    calls,
    navigator: {
      mediaDevices: {
        enumerateDevices: async () => ['camera'],
        getDisplayMedia: async constraints => (calls.push(['display', constraints]), 'display'),
        getUserMedia: async constraints => (calls.push(['user', constraints]), 'user'),
      },
    },
  };
};

test('capture helpers pass standard constraints to MediaDevices', async () => {
  const { calls, navigator } = createNavigator();
  assert.deepEqual(await listDevices({ navigator }), ['camera']);
  assert.equal(await requestCamera({ video: { width: 1280 }, navigator }), 'user');
  assert.equal(await requestMicrophone({ navigator }), 'user');
  assert.equal(await requestDisplay({ audio: true, navigator }), 'display');
  assert.deepEqual(calls, [
    ['user', { audio: false, video: { width: 1280 } }],
    ['user', { audio: true, video: false }],
    ['display', { audio: true, video: true }],
  ]);
});

test('capture helpers fail explicitly when MediaDevices is absent', () => {
  assert.throws(() => listDevices({ navigator: {} }), ReferenceError);
});

test('stopMediaStream stops every track', () => {
  const stopped = [];
  stopMediaStream({
    getTracks: () => [
      { stop: () => stopped.push('audio') },
      { stop: () => stopped.push('video') },
    ],
  });
  assert.deepEqual(stopped, ['audio', 'video']);
});
