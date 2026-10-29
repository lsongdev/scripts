import { h, useEffect, useRef } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/**
 * Top navigation: a brand, links and optional trailing content (children,
 * such as a sign-out button). Load navbar.css.
 *
 * items are `{ href, title, active }`; the active one is marked for
 * navbar.css and assistive technology, and scrolled into view where the
 * links scroll sideways (narrow screens).
 */
export function Navbar({ brand, href = '#/', mark, items = [], label = 'Menu', className = '', children, ...props }) {
  const links = useRef(null);
  const active = items.find(item => item.active)?.href;
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
      h('a', { key: item.href, href: item.href, className: cls(item.active && 'active'), 'aria-current': item.active ? 'page' : undefined }, item.title))),
    children && h('nav', null, children));
}
