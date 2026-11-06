import { expect, test } from '@playwright/test';

// Each test renders into the blank page with the published modules. Preact
// batches renders, so tests wait a tick after changing state.
test.beforeEach(async ({ page }) => {
  await page.goto('/tests/blank.html');
});

test('Table renders columns and rows, sorts from headers and shows an empty row', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render } = await import('/react/react.js');
    const { Table } = await import('/react/components/table.js');
    const tick = () => new Promise(r => setTimeout(r, 20));
    const root = document.createElement('div');
    document.body.append(root);
    const columns = [
      { key: 'name', title: 'Name', sort: true },
      { key: 'size', title: 'Size', align: 'end', sort: true, render: row => `${row.size} B` },
      { key: 'note', title: 'Note' },
    ];
    const rows = [
      { id: 'a', name: 'beta', size: 10 },
      { id: 'b', name: 'Alpha', size: 2, note: 'n' },
      { id: 'c', name: 'gamma', size: null },
    ];
    const text = () => [...root.querySelectorAll('tbody tr')].map(tr => [...tr.cells].map(td => td.textContent).join('|'));
    const sortState = () => [...root.querySelectorAll('th')].map(th => th.getAttribute('aria-sort'));
    const clicks = [];
    render(html`<${Table} columns=${columns} rows=${rows} rowKey="id"
      rowProps=${row => ({ 'data-id': row.id })} onSort=${s => clicks.push(s)} />`, root);
    await tick();
    const out = { initial: text(), headers: [...root.querySelectorAll('th')].map(th => th.textContent), sortState: sortState() };
    out.align = root.querySelector('tbody td:nth-child(2)').style.textAlign;
    out.rowAttr = root.querySelector('tbody tr').dataset.id;
    root.querySelector('th:nth-child(2) button').click();
    await tick();
    out.ascending = text();
    out.ascendingState = sortState();
    root.querySelector('th:nth-child(2) button').click();
    await tick();
    out.descending = text();
    root.querySelector('th:nth-child(1) button').click();
    await tick();
    out.byName = text();
    out.clicks = clicks;
    render(html`<${Table} columns=${columns} rows=${[]} empty="Nothing here" />`, root);
    await tick();
    out.empty = [...root.querySelectorAll('tbody td')].map(td => [td.textContent, td.colSpan]);
    render(html`<${Table} className="files"><tbody><tr><td>raw</td></tr></tbody><//>`, root);
    await tick();
    out.children = root.querySelector('table.table.files td').textContent;
    out.framed = root.firstElementChild.className;
    return out;
  });
  expect(result.headers).toEqual(['Name', 'Size', 'Note']);
  expect(result.initial).toEqual(['beta|10 B|', 'Alpha|2 B|n', 'gamma|null B|']);
  expect(result.sortState).toEqual(['none', 'none', null]);
  expect(result.align).toBe('end');
  expect(result.rowAttr).toBe('a');
  // Empty values sort last in both directions' natural order; text uses the locale.
  expect(result.ascending).toEqual(['Alpha|2 B|n', 'beta|10 B|', 'gamma|null B|']);
  expect(result.ascendingState).toEqual(['none', 'ascending', null]);
  expect(result.descending).toEqual(['gamma|null B|', 'beta|10 B|', 'Alpha|2 B|n']);
  expect(result.byName).toEqual(['Alpha|2 B|n', 'beta|10 B|', 'gamma|null B|']);
  expect(result.clicks).toEqual([
    { key: 'size', direction: 'asc' }, { key: 'size', direction: 'desc' }, { key: 'name', direction: 'asc' },
  ]);
  expect(result.empty).toEqual([['Nothing here', 3]]);
  expect(result.children).toBe('raw');
  expect(result.framed).toBe('table-scroll table-framed');
});

test('Table sorting can be controlled', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render } = await import('/react/react.js');
    const { Table } = await import('/react/components/table.js');
    const tick = () => new Promise(r => setTimeout(r, 20));
    const root = document.createElement('div');
    document.body.append(root);
    const columns = [{ key: 'n', title: 'N', sort: (a, b) => a.n - b.n }];
    const rows = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const asked = [];
    const draw = sort => render(html`<${Table} columns=${columns} rows=${rows} sort=${sort} onSort=${s => asked.push(s)} />`, root);
    const cells = () => [...root.querySelectorAll('tbody td')].map(td => td.textContent).join('');
    draw({ key: 'n', direction: 'desc' });
    await tick();
    const before = cells();
    root.querySelector('th button').click();
    await tick();
    return { before, after: cells(), asked };
  });
  expect(result.before).toBe('321');
  expect(result.after).toBe('321'); // the owner did not change sort
  expect(result.asked).toEqual([{ key: 'n', direction: 'asc' }]);
});

test('RouterView renders hash routes with params, query, lazy pages and Navbar state', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render } = await import('/react/react.js');
    const { RouterView, lazy, Navbar } = await import('/react/components/index.js');
    const { useRoute, useRouter } = await import('/react/hooks/index.js');
    const { createRouter } = await import('/navigation/router.js');
    const tick = () => new Promise(r => setTimeout(r, 30));
    history.replaceState(null, '', '#/');
    const blob = new Blob(['export default ({ params }) => `lazy ${params.id}`;'], { type: 'text/javascript' });
    const lazyUrl = URL.createObjectURL(blob);
    let loads = 0;
    const Home = () => html`<p>home</p>`;
    function Item({ params, query }) {
      const router = useRouter();
      return html`<p>item ${params.id} tab=${query.tab || '-'}</p>
        <a id="next" href=${router.href('/items/2', { tab: 'keys' })}>next</a>
        <button id="filter" onClick=${() => router.setQuery({ tab: 'files' })}>filter</button>`;
    }
    const router = createRouter([
      ['/', Home],
      ['/items/:id', Item],
      ['/lazy/:id', lazy(() => { loads++; return import(lazyUrl); })],
    ], { hash: true });
    router.start();
    const nav = [{ href: '#/', title: 'Home' }, { href: '#/items', title: 'Items' }, { href: '#/lazy', title: 'Lazy' }];
    function App() {
      const route = useRoute(router);
      return html`<${Navbar} brand="T" items=${nav} current=${router.href(route.path)} />
        <main><${RouterView} router=${router} notFound=${html`<p>missing</p>`} /></main>`;
    }
    const root = document.createElement('div');
    document.body.append(root);
    render(html`<${App} />`, root);
    const main = () => (root.querySelector('main p') ?? root.querySelector('main')).textContent.trim();
    const active = () => root.querySelector('nav a.active')?.textContent ?? null;
    const out = {};
    await tick();
    out.home = [main(), active()];
    router.navigate('/items/1');
    await tick();
    out.item = [main(), active()];
    root.querySelector('#next').click(); // a plain fragment link
    await tick();
    out.link = [main(), location.hash];
    root.querySelector('#filter').click();
    await tick();
    out.query = [main(), location.hash];
    location.hash = '#/lazy/7';
    await tick();
    await tick();
    out.lazy = [main(), active()];
    router.navigate('/lazy/8');
    await tick();
    out.lazyAgain = [main(), loads];
    router.navigate('/nowhere');
    await tick();
    out.missing = [main(), active()];
    router.stop();
    return out;
  });
  expect(result.home).toEqual(['home', 'Home']);
  expect(result.item).toEqual(['item 1 tab=-', 'Items']);
  expect(result.link).toEqual(['item 2 tab=keys', '#/items/2?tab=keys']);
  expect(result.query).toEqual(['item 2 tab=files', '#/items/2?tab=files']);
  expect(result.lazy).toEqual(['lazy 7', 'Lazy']);
  expect(result.lazyAgain).toEqual(['lazy 8', 1]);
  expect(result.missing).toEqual(['missing', null]);
});

test('useResource reloads on deps, keeps data while loading, aborts stale loads and polls', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render, useState } = await import('/react/react.js');
    const { useResource, useAction } = await import('/react/hooks/index.js');
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const aborted = [];
    const seen = [];
    let setId;
    function View() {
      const [id, set] = useState(1);
      setId = set;
      const res = useResource(signal => new Promise((resolve, reject) => {
        let settled = false;
        signal.addEventListener('abort', () => { if (!settled) aborted.push(id); reject(signal.reason); });
        setTimeout(() => {
          settled = true;
          if (id === 3) reject(new Error('boom')); else resolve(`data ${id}`);
        }, 30);
      }), [id]);
      seen.push(`${res.loading ? 'L' : '-'}:${res.data ?? ''}:${res.error?.message ?? ''}`);
      return html`<p>${res.data}</p>`;
    }
    const root = document.createElement('div');
    document.body.append(root);
    render(html`<${View} />`, root);
    await wait(60);
    setId(2);
    await wait(5);
    setId(3); // aborts the load for 2
    await wait(60);
    const states = [...new Set(seen)];

    let polls = 0;
    function Poll() {
      const res = useResource(async () => ++polls, [], { interval: data => (data < 3 ? 10 : 0) });
      return html`<p>${res.data}</p>`;
    }
    const poll = document.createElement('div');
    document.body.append(poll);
    render(html`<${Poll} />`, poll);
    await wait(150);

    let action;
    function Act() { action = useAction(); return html`<p>${action.busy ? 'busy' : 'idle'} ${action.error?.message ?? ''}</p>`; }
    const act = document.createElement('div');
    document.body.append(act);
    render(html`<${Act} />`, act);
    await wait(10);
    const first = action.run(() => wait(30).then(() => 'done'));
    const second = action.run(async () => 'twice');
    const runs = [await first, await second];
    const failed = await action.run(async () => { throw new Error('nope'); });
    await wait(20);
    render(null, root);
    return { states, aborted, polls, pollText: poll.textContent, runs, failed, actText: act.textContent.trim() };
  });
  expect(result.states).toEqual(['L::', '-:data 1:', 'L:data 1:', '-:data 1:boom']);
  expect(result.aborted).toEqual([2]);
  expect(result.polls).toBe(3);
  expect(result.pollText).toBe('3');
  expect(result.runs).toEqual(['done', undefined]);
  expect(result.failed).toBeUndefined();
  expect(result.actText).toBe('idle nope');
});

test('useEventSource opens, routes named and unnamed events, and closes on unmount', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render } = await import('/react/react.js');
    const { useEventSource } = await import('/react/hooks/index.js');
    const tick = () => new Promise(r => setTimeout(r, 20));
    const sources = [];
    class FakeSource extends EventTarget {
      static OPEN = 1;
      static CLOSED = 2;
      readyState = 0;
      constructor(url, init) { super(); this.url = url; this.init = init; sources.push(this); }
      close() { this.readyState = FakeSource.CLOSED; this.closed = true; }
      emit(type, data) {
        const event = new MessageEvent(type, { data });
        if (type === 'message') this.onmessage?.(event); else this.dispatchEvent(event);
      }
    }
    const native = window.EventSource;
    window.EventSource = FakeSource;
    const got = [];
    let open;
    function Live({ url, label }) {
      open = useEventSource(url, {
        onMessage: e => got.push(`${label}:${e.data}`),
        events: { state: e => got.push(`${label}/state:${e.data}`) },
      });
      return null;
    }
    const root = document.createElement('div');
    document.body.append(root);
    render(html`<${Live} url="/events" label="a" />`, root);
    await tick();
    const s = sources[0];
    const before = open;
    s.readyState = 1; s.onopen(); await tick();
    const opened = open;
    s.emit('message', '1');
    s.emit('state', '2');
    render(html`<${Live} url="/events" label="b" />`, root); // new handlers, same stream
    await tick();
    s.emit('message', '3');
    s.readyState = 0; s.onerror(); await tick();
    const reconnecting = open;
    render(html`<${Live} url=${null} label="b" />`, root);
    await tick();
    window.EventSource = native;
    return { count: sources.length, url: s.url, before, opened, reconnecting, got, closed: s.closed };
  });
  expect(result).toEqual({
    count: 1, url: '/events', before: false, opened: true, reconnecting: false,
    got: ['a:1', 'a/state:2', 'b:3'], closed: true,
  });
});

test('debounced value and callback settle after the wait', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render } = await import('/react/react.js');
    const { useDebouncedValue, useDebouncedCallback } = await import('/react/hooks/index.js');
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const values = [];
    const calls = [];
    let fire;
    function View({ value }) {
      values.push(useDebouncedValue(value, 30));
      fire = useDebouncedCallback(x => calls.push(`${value}:${x}`), 30);
      return null;
    }
    const root = document.createElement('div');
    document.body.append(root);
    render(html`<${View} value="a" />`, root);
    render(html`<${View} value="b" />`, root);
    await wait(5);
    render(html`<${View} value="c" />`, root);
    fire(1); fire(2);
    await wait(80);
    fire(3);
    render(null, root); // drops the pending call
    await wait(60);
    return { last: values.at(-1), sawB: values.includes('b'), calls };
  });
  expect(result.last).toBe('c');
  expect(result.sawB).toBe(false);
  expect(result.calls).toEqual(['c:2']);
});

test('Pagination moves between numbered pages, jumps and works without a count', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render } = await import('/react/react.js');
    const { Pagination } = await import('/react/components/pagination.js');
    const tick = () => new Promise(r => setTimeout(r, 20));
    const root = document.createElement('div');
    document.body.append(root);
    const asked = [];
    const draw = props => render(html`<${Pagination} onChange=${n => asked.push(n)} ...${props} />`, root);
    const items = () => [...root.querySelectorAll('.pagination > *')]
      .filter(el => !el.matches('label'))
      .map(el => (el.getAttribute('aria-current') ? `[${el.textContent}]` : el.disabled ? `(${el.textContent})` : el.textContent));
    const out = {};
    draw({ page: 1, pageCount: 1 });
    await tick();
    out.single = root.innerHTML;
    draw({ page: 5, pageCount: 10, jump: true, labels: { jump: '跳至', page: n => `第 ${n} 页` } });
    await tick();
    out.middle = items();
    out.label = root.querySelector('[aria-current="page"]').getAttribute('aria-label');
    root.querySelector('[aria-label="Next page"]').click();
    root.querySelectorAll('.pagination-item')[1].click(); // page 1
    const input = root.querySelector('.pagination-jump input');
    out.jumpLabel = root.querySelector('.pagination-jump').textContent;
    input.value = '42';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    draw({ page: 1, pageCount: 10 });
    await tick();
    out.first = items();
    draw({ page: 3, hasMore: false });
    await tick();
    out.open = items();
    return { ...out, asked };
  });
  expect(result.single).toBe('');
  expect(result.middle).toEqual(['‹', '1', '…', '4', '[5]', '6', '…', '10', '›']);
  expect(result.label).toBe('第 5 页');
  expect(result.jumpLabel).toBe('跳至');
  expect(result.first).toEqual(['(‹)', '[1]', '2', '…', '10', '›']);
  expect(result.open).toEqual(['‹', '[Page 3]', '(›)']);
  expect(result.asked).toEqual([6, 1, 10]);
});

test('Table pages its rows, keeps a footer and returns to page one on sort', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render } = await import('/react/react.js');
    const { Table } = await import('/react/components/table.js');
    const tick = () => new Promise(r => setTimeout(r, 20));
    const root = document.createElement('div');
    document.body.append(root);
    const rows = Array.from({ length: 25 }, (_, i) => ({ n: i + 1 }));
    const columns = [{ key: 'n', title: 'N', sort: true }];
    const cells = () => [...root.querySelectorAll('tbody td')].map(td => Number(td.textContent));
    const draw = list => render(html`<${Table} columns=${columns} rows=${list} pageSize=${10}
      footer=${html`<span class="count">${list.length} rows</span>`} />`, root);
    draw(rows);
    await tick();
    const out = { first: cells(), footer: root.querySelector('.table-footer .count').textContent };
    out.structure = [root.firstElementChild.className, root.querySelector('.table-framed > .table-scroll > table') !== null];
    root.querySelector('[aria-label="Page 3"]').click();
    await tick();
    out.third = cells();
    draw(rows.slice(0, 12)); // shrinks to two pages
    await tick();
    out.clamped = cells();
    root.querySelector('th button').click(); // sort asc: back to page one
    await tick();
    out.sorted = [cells()[0], root.querySelector('[aria-current="page"]').textContent];
    render(html`<${Table} columns=${columns} rows=${rows.slice(0, 3)} pageSize=${10} />`, root);
    await tick();
    out.noPager = [root.querySelector('.pagination'), root.querySelector('.table-footer') !== null];
    return out;
  });
  expect(result.first).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(result.footer).toBe('25 rows');
  expect(result.structure).toEqual(['table-framed', true]);
  expect(result.third).toEqual([21, 22, 23, 24, 25]);
  expect(result.clamped).toEqual([11, 12]);
  expect(result.sorted).toEqual([1, '1']);
  // A single page needs no pagination; the footer area stays for consistency.
  expect(result.noPager).toEqual([null, true]);
});

test('ProgressBar exposes its value', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { html, render } = await import('/react/react.js');
    const { ProgressBar } = await import('/react/components/progressbar.js');
    const root = document.createElement('div');
    document.body.append(root);
    render(html`<${ProgressBar} value=${30} max=${120} label="Download" />`, root);
    await new Promise(r => setTimeout(r, 20));
    const bar = root.querySelector('[role="progressbar"]');
    const zero = document.createElement('div');
    render(html`<${ProgressBar} value=${5} max=${0} />`, zero);
    await new Promise(r => setTimeout(r, 20));
    return {
      aria: ['aria-label', 'aria-valuenow', 'aria-valuemax'].map(a => bar.getAttribute(a)),
      width: bar.firstElementChild.style.width,
      zero: zero.querySelector('.progress-bar-inner').style.width,
    };
  });
  expect(result).toEqual({ aria: ['Download', '30', '120'], width: '25%', zero: '0%' });
});
