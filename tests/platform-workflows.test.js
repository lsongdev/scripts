import assert from 'node:assert/strict';
import test from 'node:test';
import { onServiceWorkerStateChange, registerServiceWorker } from '../browser/service-worker.js';
import { requestOrientationPermission, observeOrientation } from '../devices/orientation.js';
import { onKey } from '../dom/keyboard.js';
import {
  setMediaActionHandler,
  setMediaMetadata,
  setMediaPositionState,
  setPlaybackState,
} from '../media/session.js';

test('service-worker helpers return native values and lifecycle disposers', async () => {
  const registration = {};
  const calls = [];
  const result = await registerServiceWorker('/worker.js', { scope: '/app/' }, {
    navigator: {
      serviceWorker: {
        register: async (...args) => (calls.push(args), registration),
      },
    },
  });
  assert.equal(result, registration);
  assert.deepEqual(calls, [['/worker.js', { scope: '/app/', type: 'module' }]]);

  const worker = new EventTarget();
  worker.state = 'installed';
  let state;
  const dispose = onServiceWorkerStateChange(worker, value => state = value);
  worker.dispatchEvent(new Event('statechange'));
  dispose();
  assert.equal(state, 'installed');
});

test('keyboard and orientation observers are inert until explicitly registered', async () => {
  const target = new EventTarget();
  let keys = 0;
  const disposeKey = onKey(target, 'Enter', () => keys += 1);
  const event = new Event('keydown');
  event.key = 'Enter';
  target.dispatchEvent(event);
  disposeKey();
  target.dispatchEvent(event);
  assert.equal(keys, 1);

  let orientation;
  const disposeOrientation = observeOrientation(event => orientation = event, { window: target });
  const orientationEvent = new Event('deviceorientation');
  target.dispatchEvent(orientationEvent);
  disposeOrientation();
  assert.equal(orientation, orientationEvent);
  assert.equal(await requestOrientationPermission({ DeviceOrientationEvent: class {} }), 'granted');
});

test('Media Session helpers preserve native metadata and explicit state', () => {
  class Metadata {
    constructor(value) { Object.assign(this, value); }
  }
  const actions = [];
  const session = {
    setActionHandler: (...args) => actions.push(args),
    setPositionState: value => actions.push(['position', value]),
  };
  const navigator = { mediaSession: session };
  const metadata = setMediaMetadata({ title: 'Track' }, {
    MediaMetadata: Metadata,
    navigator,
  });
  assert.equal(session.metadata, metadata);
  assert.equal(setPlaybackState('playing', { navigator }), 'playing');
  const handler = () => {};
  assert.equal(setMediaActionHandler('play', handler, { navigator }), handler);
  assert.deepEqual(setMediaPositionState({ duration: 10, position: 2 }, { navigator }), {
    duration: 10, position: 2,
  });
  assert.deepEqual(actions, [['play', handler], ['position', { duration: 10, position: 2 }]]);
});
