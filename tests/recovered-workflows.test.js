import assert from 'node:assert/strict';
import test from 'node:test';

import { getPageLifecycleState, observePageLifecycle } from '../browser/page-lifecycle.js';
import { createMediaRecorder, startRecording } from '../media/recording.js';
import {
  createStorageSnapshot,
  parseStorageSnapshot,
  restoreStorageSnapshot,
  stringifyStorageSnapshot,
} from '../storage/snapshot.js';

class FakeRecorder extends EventTarget {
  static last;
  state = 'inactive';
  mimeType = 'audio/webm';

  constructor(stream, options) {
    super();
    this.stream = stream;
    this.options = options;
    FakeRecorder.last = this;
  }

  start(timeslice) {
    this.timeslice = timeslice;
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.dispatchEvent(new Event('stop'));
  }

  data(blob) {
    const event = new Event('dataavailable');
    event.data = blob;
    this.dispatchEvent(event);
  }
}

function memoryStorage(entries = []) {
  const data = new Map(entries);
  return {
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] ?? null; },
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    clear() { data.clear(); },
    entries: () => [...data.entries()],
  };
}

test('recording returns native ownership and resolves collected Blob data', async () => {
  const stream = {};
  const recorder = createMediaRecorder(stream, { mimeType: 'audio/webm' }, { MediaRecorder: FakeRecorder });
  assert.equal(recorder.stream, stream);

  const session = startRecording(stream, { timeslice: 10 }, { MediaRecorder: FakeRecorder });
  assert.equal(session.recorder, FakeRecorder.last);
  assert.equal(session.recorder.state, 'recording');
  session.recorder.data(new Blob(['one']));
  session.recorder.data(new Blob([]));
  const result = await session.stop();
  assert.equal(await result.text(), 'one');
  assert.equal(result.type, 'audio/webm');
});

test('recording abort rejects with the signal reason and stops owned work', async () => {
  const controller = new AbortController();
  const session = startRecording({}, { signal: controller.signal }, { MediaRecorder: FakeRecorder });
  const reason = new Error('cancel recording');
  controller.abort(reason);
  await assert.rejects(session.result, error => error === reason);
  assert.equal(session.recorder.state, 'inactive');
});

test('page lifecycle observer reports native state and disposes on abort', () => {
  const documentTarget = new EventTarget();
  documentTarget.visibilityState = 'hidden';
  documentTarget.hidden = true;
  const windowTarget = new EventTarget();
  const controller = new AbortController();
  const seen = [];
  observePageLifecycle((state, event) => seen.push([state.hidden, event.type]), {
    document: documentTarget,
    window: windowTarget,
    signal: controller.signal,
  });
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  windowTarget.dispatchEvent(new Event('pagehide'));
  controller.abort();
  windowTarget.dispatchEvent(new Event('pageshow'));
  assert.deepEqual(seen, [[true, 'visibilitychange'], [true, 'pagehide']]);
  assert.deepEqual(getPageLifecycleState({ document: documentTarget }), {
    visibilityState: 'hidden', hidden: true,
  });
});

test('storage snapshots validate completely before replacing target state', () => {
  const source = memoryStorage([['theme', 'dark'], ['count', '2']]);
  const snapshot = createStorageSnapshot(source);
  const encoded = stringifyStorageSnapshot(snapshot);
  const target = memoryStorage([['old', 'value']]);
  assert.equal(restoreStorageSnapshot(parseStorageSnapshot(encoded), { storage: target, replace: true }), 2);
  assert.deepEqual(target.entries(), [['theme', 'dark'], ['count', '2']]);
  assert.throws(() => restoreStorageSnapshot({ version: 1, entries: [['valid', 'x'], ['bad', 1]] }, {
    storage: target,
    replace: true,
  }), TypeError);
  assert.deepEqual(target.entries(), [['theme', 'dark'], ['count', '2']]);
});
