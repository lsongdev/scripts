import assert from 'node:assert/strict';
import test from 'node:test';

import { on, ready } from '../dom/events.js';

test('on returns a disposer and passes native event options through', () => {
  const target = new EventTarget();
  let calls = 0;
  const dispose = on(target, 'change', () => calls += 1);

  target.dispatchEvent(new Event('change'));
  dispose();
  target.dispatchEvent(new Event('change'));
  assert.equal(calls, 1);
});

test('on honors AbortSignal through the native event contract', () => {
  const target = new EventTarget();
  const controller = new AbortController();
  let calls = 0;
  on(target, 'change', () => calls += 1, { signal: controller.signal });
  controller.abort();
  target.dispatchEvent(new Event('change'));
  assert.equal(calls, 0);
});

test('ready resolves immediately for an interactive document', async () => {
  const document = Object.assign(new EventTarget(), { readyState: 'interactive' });
  let called = false;
  await ready(() => called = true, { document });
  assert.equal(called, true);
});

test('ready waits for DOMContentLoaded and can be aborted', async () => {
  const document = Object.assign(new EventTarget(), { readyState: 'loading' });
  const pending = ready(undefined, { document });
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await pending;

  const controller = new AbortController();
  const waiting = ready(undefined, { document, signal: controller.signal });
  controller.abort();
  await assert.rejects(waiting, error => error === controller.signal.reason);
});
