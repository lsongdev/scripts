import assert from 'node:assert/strict';
import test from 'node:test';

import { createRouter } from '../navigation/router.js';

class TestWindow extends EventTarget {
  constructor(url) {
    super();
    this.location = new URL(url);
    this.history = {
      state: null,
      back: () => {},
      pushState: (state, _unused, next) => {
        this.history.state = state;
        this.location = new URL(next, this.location);
      },
      replaceState: (state, _unused, next) => {
        this.history.state = state;
        this.location = new URL(next, this.location);
      },
    };
  }
}

test('router construction is inert and resolve uses URLPattern groups', () => {
  const window = new TestWindow('https://example.test/users/42');
  const router = createRouter({ '/users/:id': 'user' }, { window });

  assert.equal(router.current, null);
  const route = router.resolve();
  assert.equal(route.value, 'user');
  assert.deepEqual(route.params, { id: '42' });
});

test('router starts explicitly and aborts the previous route on navigation', () => {
  const window = new TestWindow('https://example.test/');
  const router = createRouter([
    ['/', 'home'],
    ['/users/:id', 'user'],
  ], { window });
  const routes = [];
  router.subscribe(route => routes.push(route));

  const stop = router.start();
  const home = routes.at(-1);
  assert.equal(home.value, 'home');
  assert.equal(home.signal.aborted, false);

  const user = router.navigate('/users/7', { state: { source: 'test' } });
  assert.equal(home.signal.aborted, true);
  assert.equal(user.value, 'user');
  assert.deepEqual(user.params, { id: '7' });
  assert.deepEqual(user.state, { source: 'test' });

  stop();
  assert.equal(user.signal.aborted, true);
  assert.equal(router.current, null);
});

test('router subscriptions can be removed with AbortSignal', () => {
  const window = new TestWindow('https://example.test/');
  const router = createRouter({ '/': 'home' }, { window });
  const controller = new AbortController();
  let calls = 0;
  router.subscribe(() => calls += 1, { signal: controller.signal });
  controller.abort();
  router.start();
  assert.equal(calls, 0);
});
