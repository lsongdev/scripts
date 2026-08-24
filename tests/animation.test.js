import assert from 'node:assert/strict';
import test from 'node:test';
import { bounceInOut, cubicInOut, linear } from '../animation/easing.js';
import { tween } from '../animation/tween.js';

test('easing functions preserve endpoints and expected symmetry', () => {
  for (const easing of [linear, cubicInOut, bounceInOut]) {
    assert.equal(easing(0), 0);
    assert.equal(easing(1), 1);
  }
  assert.equal(cubicInOut(0.5), 0.5);
});

test('tween does not mutate inputs and resolves its final numeric state', async () => {
  const frames = [];
  const from = { x: 0 };
  const to = { x: 10, y: 5 };
  const updates = [];
  const control = tween({
    cancelAnimationFrame() {},
    duration: 100,
    from,
    now: () => 0,
    onUpdate: state => updates.push(state),
    requestAnimationFrame: callback => (frames.push(callback), frames.length),
    to,
  });
  frames.shift()(0);
  frames.shift()(50);
  frames.shift()(100);
  assert.deepEqual(await control.finished, { x: 10, y: 5 });
  assert.deepEqual(updates.map(state => state.x), [0, 5, 10]);
  assert.deepEqual(from, { x: 0 });
  assert.deepEqual(to, { x: 10, y: 5 });
});

test('tween rejects with the AbortSignal reason and cancels its frame', async () => {
  const controller = new AbortController();
  let canceled;
  const control = tween({
    cancelAnimationFrame: frame => canceled = frame,
    from: { x: 0 },
    onUpdate() {},
    requestAnimationFrame: () => 42,
    signal: controller.signal,
    to: { x: 1 },
  });
  const reason = new Error('stop');
  controller.abort(reason);
  await assert.rejects(control.finished, error => error === reason);
  assert.equal(canceled, 42);
});
