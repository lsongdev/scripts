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

test('hash routes read the fragment as path and query', () => {
  const window = new TestWindow('https://example.test/app/?ignored=1#/users/42?tab=keys&page=2');
  const router = createRouter([
    ['/', 'home'],
    ['/users/:id', 'user'],
  ], { window, hash: true });

  router.start();
  const route = router.current;
  assert.equal(route.value, 'user');
  assert.deepEqual(route.params, { id: '42' });
  assert.equal(route.path, '/users/42');
  assert.deepEqual(route.query, { tab: 'keys', page: '2' });
  router.stop();

  window.location = new URL('https://example.test/app/');
  assert.equal(router.resolve().value, 'home', 'an empty fragment is the root');
});

test('hash navigation, links and query updates keep the page URL', () => {
  const window = new TestWindow('https://example.test/app/index.html#/');
  const router = createRouter({ '/': 'home', '/items': 'items' }, { window, hash: true });
  const seen = [];
  router.subscribe(route => seen.push(route));
  router.start();

  assert.equal(router.href('/items', { q: 'a b', empty: '', none: null }), '#/items?q=a+b');
  router.navigate('/items?q=x');
  assert.equal(window.location.pathname, '/app/index.html');
  assert.equal(window.location.hash, '#/items?q=x');
  assert.equal(seen.at(-1).value, 'items');

  router.setQuery({ sort: 'size', q: '' });
  assert.equal(window.location.hash, '#/items?sort=size');
  assert.deepEqual(seen.at(-1).query, { sort: 'size' });
  assert.equal(seen.at(-1).value, 'items');

  // A fragment changed outside the router, as by a link, is routed too.
  window.location = new URL('#/', window.location);
  window.dispatchEvent(new Event('hashchange'));
  assert.equal(seen.at(-1).value, 'home');
  router.stop();
});

test('history routes expose path, query and plain links', () => {
  const window = new TestWindow('https://example.test/items?q=x');
  const router = createRouter({ '/items': 'items' }, { window });
  router.start();
  const route = router.current;
  assert.equal(route.path, '/items');
  assert.deepEqual(route.query, { q: 'x' });
  assert.equal(router.href('/items', { q: 'y' }), '/items?q=y');
  assert.equal(router.setQuery({ page: 2 }).url.search, '?q=x&page=2');
  router.stop();
});

test('an unmatched route still has a path, query and empty params', () => {
  const window = new TestWindow('https://example.test/#/nope?x=1');
  const router = createRouter({ '/': 'home' }, { window, hash: true });
  router.start();
  const route = router.current;
  assert.equal(route.value, undefined);
  assert.equal(route.path, '/nope');
  assert.deepEqual(route.params, {});
  assert.deepEqual(route.query, { x: '1' });
  router.stop();
});
