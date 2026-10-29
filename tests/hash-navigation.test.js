import assert from 'node:assert/strict';
import test from 'node:test';
import { createHashNavigation } from '../navigation/hash.js';

// Model the browser's duplicate popstate/hashchange delivery and asynchronous
// history traversal, so rejecting Back cannot silently corrupt the stack.
class Browser extends EventTarget {
  entries = [{ url: 'http://localhost/#/', state: null }];
  position = 0;
  location = { href: this.entries[0].url };
  history = {
    get state() { return this.owner.entries[this.owner.position].state; },
    owner: this,
    replaceState: (state, _, url) => { this.entries[this.position] = { state, url }; this.location.href = url; },
    pushState: (state, _, url) => {
      this.entries.splice(++this.position, Infinity, { state, url });
      this.location.href = url;
    },
    go: delta => {
      const next = this.position + delta;
      if (next < 0 || next >= this.entries.length) return;
      queueMicrotask(() => {
        this.position = next;
        this.location.href = this.entries[next].url;
        this.dispatchEvent(new Event('popstate'));
        this.dispatchEvent(new Event('hashchange'));
      });
    },
  };
}
const settled = () => new Promise(resolve => setImmediate(resolve));

test('only accepted routes are published; cancelled navigation changes no history', () => {
  const win = new Browser();
  const nav = createHashNavigation({ window: win });
  let changes = 0;
  win.addEventListener('routechange', () => changes++);
  nav.navigate('/jobs');
  const release = nav.beforeLeave(() => false);
  assert.equal(nav.navigate('/jobs/new'), false);
  assert.equal(win.entries.length, 2);
  assert.equal(win.location.href, 'http://localhost/#/jobs');
  assert.equal(changes, 1);
  release();
  assert.equal(nav.navigate('/jobs/new'), true);
  assert.equal(changes, 2);
});

test('cancelling Back preserves the form and the forward/back stack', async () => {
  const win = new Browser();
  const nav = createHashNavigation({ window: win });
  nav.navigate('/jobs');
  nav.navigate('/jobs/new');
  let allow = false, questions = 0, changes = 0;
  nav.beforeLeave(() => { questions++; return allow; });
  win.addEventListener('routechange', () => changes++);
  win.history.go(-1);
  await settled();
  assert.equal(win.location.href, 'http://localhost/#/jobs/new');
  assert.equal(win.position, 2);
  assert.equal(win.entries.length, 3);
  assert.equal(changes, 0);
  assert.equal(questions, 1);
  allow = true;
  win.history.go(-1);
  await settled();
  assert.equal(win.location.href, 'http://localhost/#/jobs');
  assert.equal(changes, 1); // popstate and hashchange publish only once
  allow = false;
  win.history.go(1);
  await settled();
  assert.equal(win.position, 1);
  assert.equal(questions, 3);
});

test('cancelling a multi-entry traversal restores the correct entry', async () => {
  const win = new Browser();
  const nav = createHashNavigation({ window: win });
  nav.navigate('/repos');
  nav.navigate('/repos/1');
  nav.navigate('/repos/1/edit');
  nav.beforeLeave(() => false);
  win.history.go(-3);
  await settled();
  assert.equal(win.position, 3);
  assert.equal(win.location.href, 'http://localhost/#/repos/1/edit');
});

test('a manually changed hash can be cancelled without replacing the form entry', async () => {
  const win = new Browser();
  const nav = createHashNavigation({ window: win });
  nav.navigate('/hosts/new');
  nav.beforeLeave(() => false);
  win.history.pushState(null, '', 'http://localhost/#/other');
  win.dispatchEvent(new Event('hashchange'));
  await settled();
  assert.equal(win.position, 1);
  assert.equal(win.entries[1].url, 'http://localhost/#/hosts/new');
});

test('shadow-root links use the same guard and modified clicks remain native', () => {
  const win = new Browser();
  const nav = createHashNavigation({ window: win });
  const release = nav.beforeLeave(() => false);
  const link = { tagName: 'A', href: 'http://localhost/#/hosts/new', target: '', hasAttribute: () => false };
  const click = (properties = {}) => {
    const event = new Event('click', { cancelable: true });
    Object.assign(event, { button: 0, composedPath: () => [{}, link], ...properties });
    win.dispatchEvent(event);
    return event;
  };
  assert.equal(click().defaultPrevented, true);
  assert.equal(win.entries.length, 1);
  assert.equal(click({ ctrlKey: true }).defaultPrevented, false);
  release();
  click();
  assert.equal(win.location.href, link.href);
});

test('replace and reload retain history indices and disposal releases guards', async () => {
  const win = new Browser();
  let nav = createHashNavigation({ window: win });
  nav.navigate('/jobs');
  nav.navigate('/jobs/new');
  nav.navigate('/jobs/1', { replace: true });
  assert.equal(win.entries.length, 3);
  nav.dispose();
  nav = createHashNavigation({ window: win });
  nav.beforeLeave(() => false);
  win.history.go(-1);
  await settled();
  assert.equal(win.position, 2);
  assert.equal(win.location.href, 'http://localhost/#/jobs/1');
  nav.dispose();
  assert.equal(nav.canLeave(), true);
});
