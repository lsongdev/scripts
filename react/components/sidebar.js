import { h, useEffect, useRef, useState } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

// sidebar.css switches to its mobile layout at this width.
const MOBILE = '(max-width: 768px)';

const Item = ({ item }) =>
  h('li', null, h('a', {
    href: item.href,
    className: cls(item.active && 'menu-item-active'),
    'aria-current': item.active ? 'page' : undefined,
    title: item.title,
  },
  h('i', { 'aria-hidden': 'true' }, item.icon || '•'),
  h('span', null, item.title),
  item.badge != null && h('span', { className: 'menu-badge' }, item.badge)));

/**
 * Side navigation: a brand, a vertical menu and an optional footer. Load
 * sidebar.css and menu.css.
 *
 * groups are `{ title, items }`, items `{ href, title, icon, badge, active }`;
 * pass `items` instead for a single untitled group. The toggle collapses the
 * sidebar to its icons on wide screens and opens it as a menu on narrow
 * ones, where following a link or pressing Escape closes it again.
 */
export function Sidebar({
  brand, href = '#/', mark, groups, items, footer, label = 'Menu',
  openLabel = 'Open menu', closeLabel = 'Close menu',
  collapseLabel = 'Collapse menu', expandLabel = 'Expand menu',
  className = '', ...props
}) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => globalThis.matchMedia?.(MOBILE).matches ?? false);
  const toggle = useRef(null);
  useEffect(() => {
    const media = globalThis.matchMedia?.(MOBILE);
    if (!media) return;
    // Each layout has its own meaning of open, so a resize resets it.
    const change = () => { setMobile(media.matches); setOpen(false); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const escape = event => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    addEventListener('keydown', escape);
    return () => removeEventListener('keydown', escape);
  }, [open, mobile]);
  const closeOnLink = event => { if (mobile && event.target.closest('a')) setOpen(false); };
  const list = groups || [{ items: items || [] }];
  const toggleLabel = mobile ? (open ? closeLabel : openLabel) : (open ? expandLabel : collapseLabel);
  return h('aside', { ...props, className: cls('sidebar', open && 'sidebar-open', className) },
    h('div', { className: 'sidebar-header' },
      h('a', { className: 'sidebar-brand', href, onClick: closeOnLink },
        mark && h('span', { className: 'sidebar-brand-mark', 'aria-hidden': 'true' }, mark),
        h('h1', null, brand)),
      h('button', {
        type: 'button', ref: toggle, className: 'sidebar-toggle',
        'aria-label': toggleLabel, title: toggleLabel, 'aria-expanded': String(mobile ? open : !open),
        onClick: () => setOpen(o => !o),
      }, mobile && open ? '✕' : '☰')),
    h('nav', { 'aria-label': label, className: 'sidebar-nav', onClick: closeOnLink },
      h('ul', { className: 'menu menu-vertical' }, list.flatMap((group, i) => [
        group.title && h('li', { key: 'heading-' + i, className: 'menu-heading', role: 'presentation' }, group.title),
        ...group.items.map(item => h(Item, { key: item.href, item })),
      ]))),
    footer && h('div', { className: 'sidebar-footer' }, footer));
}
