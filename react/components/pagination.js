import { h, useEffect, useState } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

const defaults = {
  navigation: 'Pagination',
  previous: 'Previous page',
  next: 'Next page',
  page: n => `Page ${n}`,
  jump: 'Go to',
};

/**
 * The pages of a list: previous and next, and with a known `pageCount` the
 * page numbers around the current one, gaps (…) and the first and last
 * pages. Without a count, `hasMore` says whether a next page exists and the
 * current page number shows between the arrows. Pages count from 1;
 * onChange(page) asks for another. `jump` adds a field to type a page.
 * `labels` replaces the accessible names and texts (see defaults above),
 * for another language. Nothing renders when there is only one page.
 * pagination.css.
 */
export function Pagination({
  page, pageCount, hasMore = false, onChange, siblings = 1, jump = false,
  labels, className = '', ...props
}) {
  const text = { ...defaults, ...labels };
  const known = Number.isFinite(pageCount);
  const last = known ? Math.max(1, pageCount) : null;
  const canNext = known ? page < last : hasMore;
  if (page <= 1 && !canNext) return null;
  const go = target => { if (target !== page) onChange?.(target); };
  const item = (target, content, extra = {}) => h('button', {
    type: 'button', className: 'pagination-item', onClick: () => go(target), ...extra,
  }, content);

  return h('nav', { 'aria-label': text.navigation, ...props, className: cls('pagination', className) },
    item(page - 1, '‹', { 'aria-label': text.previous, disabled: page <= 1, key: 'previous' }),
    known
      ? pages(page, last, siblings).map((n, i) => n === null
        ? h('span', { key: `gap${i}`, className: 'pagination-gap', 'aria-hidden': 'true' }, '…')
        : item(n, n, { key: n, 'aria-label': text.page(n), 'aria-current': n === page ? 'page' : undefined }))
      : h('span', { key: 'status', className: 'pagination-status', 'aria-current': 'page' }, text.page(page)),
    item(page + 1, '›', { 'aria-label': text.next, disabled: !canNext, key: 'next' }),
    jump && known && h(Jump, { key: 'jump', page, last, label: text.jump, onJump: go }));
}

// pages lists the page numbers to show, with null for a gap: the first and
// last pages, and `siblings` pages either side of the current one. A gap
// of a single page shows that page instead.
export function pages(page, last, siblings = 1) {
  const shown = new Set([1, last]);
  for (let n = page - siblings; n <= page + siblings; n++) if (n >= 1 && n <= last) shown.add(n);
  const sorted = [...shown].sort((a, b) => a - b);
  const out = [];
  for (const n of sorted) {
    const previous = out.at(-1);
    if (previous != null && n - previous === 2) out.push(n - 1);
    else if (previous != null && n - previous > 2) out.push(null);
    out.push(n);
  }
  return out;
}

function Jump({ page, last, label, onJump }) {
  const [value, setValue] = useState(String(page));
  useEffect(() => setValue(String(page)), [page]);
  const commit = () => {
    const n = Math.round(Number(value));
    if (Number.isFinite(n) && value.trim() !== '') onJump(Math.min(last, Math.max(1, n)));
    else setValue(String(page));
  };
  return h('label', { className: 'pagination-jump' }, label,
    h('input', {
      className: 'input', type: 'number', inputMode: 'numeric', min: 1, max: last, value,
      onInput: e => setValue(e.currentTarget.value),
      onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } },
      onBlur: commit,
    }));
}
