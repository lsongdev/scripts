import assert from 'node:assert/strict';
import test from 'node:test';

import { createSpectrumRenderer, drawSpectrum } from '../media/spectrum.js';

function fakeCanvas() {
  const calls = [];
  const context = {
    canvas: { width: 100, height: 50 },
    fillStyle: '',
    save() { calls.push('save'); },
    restore() { calls.push('restore'); },
    fillRect(...args) { calls.push(['fillRect', ...args]); },
  };
  return { calls, context, canvas: { getContext: () => context } };
}

test('spectrum drawing preserves context state and maps byte magnitudes', () => {
  const { calls, context } = fakeCanvas();
  drawSpectrum(context, new Uint8Array([0, 255]), { barGap: 2, minHeight: 2 });
  assert.equal(calls[0], 'save');
  assert.equal(calls.at(-1), 'restore');
  assert.deepEqual(calls[2], ['fillRect', 0, 48, 49, 2]);
  assert.deepEqual(calls[3], ['fillRect', 51, 0, 49, 50]);
});

test('spectrum renderer owns and cancels exactly one animation frame', () => {
  const { canvas } = fakeCanvas();
  const callbacks = new Map();
  const cancelled = [];
  let nextFrame = 0;
  const analyser = {
    frequencyBinCount: 2,
    getByteFrequencyData(values) { values.set([64, 128]); },
  };
  const renderer = createSpectrumRenderer(canvas, analyser, {
    requestFrame(callback) { const id = ++nextFrame; callbacks.set(id, callback); return id; },
    cancelFrame(id) { cancelled.push(id); callbacks.delete(id); },
  });
  renderer.start();
  assert.equal(renderer.running, true);
  callbacks.get(1)();
  renderer.stop();
  assert.equal(renderer.running, false);
  assert.deepEqual(cancelled, [2]);
});
