import { h, useEffect, useRef } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/**
 * Top navigation: a brand, links and optional trailing content (children,
 * such as a sign-out button). Load navbar.css.
 *
 * items are `{ href, title, active }`; the active one is marked for
 * navbar.css and assistive technology, and scrolled into view where the
 * links scroll sideways (narrow screens).
 *
 * Instead of marking items, pass `current`, the href of the current page
 * (such as `router.href(route.path)`): the item whose href is the longest
 * prefix of it, at a path segment, is active. A root href ("/" or "#/") is
 * only active on the root itself.
 */
export function Navbar({ brand, href = '#/', mark, items = [], current, label = 'Menu', className = '', children, ...props }) {
  const links = useRef(null);
  const active = items.find(item => item.active)?.href ?? activeHref(items, current);
  useEffect(() => {
    const nav = links.current;
    const link = nav?.querySelector('a.active');
    if (!link || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = link.offsetLeft - nav.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
  }, [active]);
  return h('header', { ...props, className: cls('navbar', className) },
    h('a', { className: 'navbar-brand', href },
      mark && h('span', { className: 'navbar-brand-mark', 'aria-hidden': 'true' }, mark),
      h('h1', null, brand)),
    h('nav', { ref: links, 'aria-label': label }, items.map(item =>
      h('a', { key: item.href, href: item.href, className: cls(item.href === active && 'active'), 'aria-current': item.href === active ? 'page' : undefined }, item.title))),
    children && h('nav', null, children));
}

const pathOf = href => href.split('?')[0];

/** The href among items' that is the longest segment prefix of current. */
function activeHref(items, current) {
  if (current == null) return undefined;
  const here = pathOf(current);
  let best;
  for (const { href } of items) {
    const path = pathOf(href);
    const root = path === '/' || path === '#/';
    const hit = here === path || (!root && here.startsWith(path.endsWith('/') ? path : path + '/'));
    if (hit && (!best || path.length > pathOf(best).length)) best = href;
  }
  return best;
}
