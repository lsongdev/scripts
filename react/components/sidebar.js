import { createContext, h, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

// sidebar.css switches to its mobile layout at this width.
const MOBILE = '(max-width: 768px)';

// The menu is one tree: a node with href is a link, a node with items and no
// href is a group (a heading over a list of its own), and a link with items
// has a nested list below it. Every presentation (static headings,
// collapsible groups, icons only) renders this same markup.
const key = node => node.id ?? node.href ?? node.title;
const isGroup = node => node.href == null && Array.isArray(node.items);
const contains = (node, target) => node === target || (node.items || []).some(n => contains(n, target));
const findActive = nodes => {
  for (const node of nodes) {
    if (node.active) return node;
    const found = node.items && findActive(node.items);
    if (found) return found;
  }
  return null;
};
// Keys of the groups, at any depth, that satisfy test.
const groupKeys = (nodes, test, out = []) => {
  for (const node of nodes) {
    if (isGroup(node) && test(node)) out.push(key(node));
    if (node.items) groupKeys(node.items, test, out);
  }
  return out;
};

// A group's icon in the icons-only sidebar: its own, or its first link's.
const groupIcon = node => node.icon ?? (node.items || []).map(groupIcon).find(Boolean);

const MenuState = createContext({ collapsible: false, collapsed: new Set(), toggle() {} });

const Link = ({ node }) =>
  h('a', {
    href: node.href,
    className: cls(node.active && 'menu-item-active'),
    'aria-current': node.active ? 'page' : undefined,
    title: node.title,
  },
  h('i', { 'aria-hidden': 'true' }, node.icon || '•'),
  h('span', null, node.title),
  node.badge != null && h('span', { className: 'menu-badge' }, node.badge));

const List = ({ nodes, ...props }) =>
  h('ul', props, nodes.map(node => h(Node, { key: key(node), node })));

function Group({ node }) {
  const { collapsible, collapsed, toggle, active, flyouts } = useContext(MenuState);
  const id = useId();
  const heading = `${id}-heading`;
  const list = `${id}-list`;
  const current = active != null && contains(node, active);
  if (flyouts) return h(Flyout, { node, heading, list, current });
  const expanded = !collapsed.has(key(node));
  // Like a link: the icon, when the group has one, then the label.
  const label = [node.icon != null && h('i', { 'aria-hidden': 'true' }, node.icon), h('span', null, node.title)];
  return h('li', { className: cls('menu-group', current && 'menu-group-active') },
    collapsible
      ? h('button', {
        type: 'button', id: heading, className: 'menu-heading',
        'aria-expanded': String(expanded), 'aria-controls': list,
        onClick: () => toggle(key(node)),
      }, label)
      : h('span', { id: heading, className: 'menu-heading' }, label),
    h(List, { nodes: node.items, id: list, 'aria-labelledby': heading, hidden: collapsible && !expanded }));
}

// In the icons-only sidebar a group is an icon button, and its own list
// opens as a panel beside the sidebar: on hover with a mouse, or on click
// or Enter. It closes when the pointer or focus leaves it, on Escape, on a
// click elsewhere, and on following a link.
function Flyout({ node, heading, list, current }) {
  const { flyout, setFlyout } = useContext(MenuState);
  const k = key(node);
  const open = flyout === k;
  const item = useRef(null);
  const button = useRef(null);
  const panel = useRef(null);
  const timer = useRef(null);
  const show = () => { clearTimeout(timer.current); setFlyout(k); };
  const hide = (delay = 0) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlyout(f => (f === k ? null : f)), delay);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!item.current?.contains(event.target)) hide(); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  // Beside the sidebar, level with the button, kept inside the viewport.
  useLayoutEffect(() => {
    if (!open) return;
    const b = button.current.getBoundingClientRect();
    const edge = button.current.closest('.sidebar')?.getBoundingClientRect().right ?? b.right;
    const p = panel.current;
    p.style.left = `${edge + 4}px`;
    p.style.top = `${Math.max(8, Math.min(b.top, innerHeight - p.offsetHeight - 8))}px`;
  }, [open]);
  const mouse = fn => event => { if (event.pointerType === 'mouse') fn(); };
  return h('li', {
    ref: item,
    className: cls('menu-group menu-flyout', current && 'menu-group-active', open && 'menu-flyout-open'),
    onPointerEnter: mouse(show),
    onPointerLeave: mouse(() => hide(200)),
    onFocusOut: event => { if (!event.currentTarget.contains(event.relatedTarget)) hide(); },
    onKeyDown: event => {
      if (event.key !== 'Escape' || !open) return;
      event.stopPropagation();
      setFlyout(null);
      button.current.focus();
    },
  },
  h('button', {
    type: 'button', ref: button, id: heading, className: 'menu-heading', title: node.title,
    'aria-expanded': String(open), 'aria-controls': list,
    onClick: show,
  },
  h('i', { 'aria-hidden': 'true' }, groupIcon(node) || '•'),
  h('span', null, node.title)),
  h('ul', {
    ref: panel, id: list, 'aria-labelledby': heading, 'data-title': node.title, hidden: !open,
    onClick: event => { if (event.target.closest('a')) setFlyout(null); },
  }, node.items.map(n => h(Node, { key: key(n), node: n }))));
}

const Node = ({ node }) => isGroup(node)
  ? h(Group, { node })
  : h('li', null, h(Link, { node }), node.items?.length > 0 && h(List, { nodes: node.items }));

/**
 * Side navigation: a brand, a vertical menu and an optional footer. Load
 * sidebar.css and menu.css.
 *
 * items is the menu tree. Links are `{ href, title, icon, badge, active,
 * items }`; groups are `{ id, title, icon, items, open }` and render as
 * `<li class="menu-group">` holding a `.menu-heading` (icon and label, like
 * a link) and their own list.
 * collapsible makes the headings disclosure buttons: groups start open
 * unless `open: false`, and the groups holding the active link open when it
 * becomes active. The toggle collapses the sidebar to its icons on wide
 * screens, where each group is one icon (`icon`, or its first link's) whose
 * links open in a panel beside the sidebar, and opens it as a menu on
 * narrow ones, where following a link or pressing Escape closes it again.
 * menuClassName adds classes to the menu list, for an application's own
 * look (e.g. small labels for headings).
 */
export function Sidebar({
  brand, href = '#/', mark, items = [], footer, collapsible = false, menuClassName = '', label = 'Menu',
  openLabel = 'Open menu', closeLabel = 'Close menu',
  collapseLabel = 'Collapse menu', expandLabel = 'Expand menu',
  className = '', ...props
}) {
  const [open, setOpen] = useState(false);
  // The group whose flyout is open in the icons-only sidebar; every change
  // of layout or of open closes it.
  const [flyout, setFlyout] = useState(null);
  const [mobile, setMobile] = useState(() => globalThis.matchMedia?.(MOBILE).matches ?? false);
  const [collapsed, setCollapsed] = useState(() => new Set(groupKeys(items, n => n.open === false)));
  const toggle = useRef(null);
  useEffect(() => {
    const media = globalThis.matchMedia?.(MOBILE);
    if (!media) return;
    // Each layout has its own meaning of open, so a resize resets it.
    const change = () => { setMobile(media.matches); setOpen(false); setFlyout(null); };
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
  // Open the groups holding the active link whenever it changes.
  const active = findActive(items);
  const activeKey = active ? key(active) : null;
  useEffect(() => {
    if (!active) return;
    const holding = groupKeys(items, n => contains(n, active));
    setCollapsed(c => holding.some(k => c.has(k)) ? new Set([...c].filter(k => !holding.includes(k))) : c);
  }, [activeKey]);
  const toggleGroup = k => setCollapsed(c => {
    const next = new Set(c);
    if (!next.delete(k)) next.add(k);
    return next;
  });
  const iconsOnly = open && !mobile;
  const menu = { collapsible, collapsed, toggle: toggleGroup, active, flyouts: iconsOnly, flyout, setFlyout };
  const closeOnLink = event => { if (mobile && event.target.closest('a')) setOpen(false); };
  const toggleLabel = mobile ? (open ? closeLabel : openLabel) : (open ? expandLabel : collapseLabel);
  return h('aside', { ...props, className: cls('sidebar', open && 'sidebar-open', className) },
    h('div', { className: 'sidebar-header' },
      h('a', { className: 'sidebar-brand', href, onClick: closeOnLink },
        mark && h('span', { className: 'sidebar-brand-mark', 'aria-hidden': 'true' }, mark),
        h('h1', null, brand)),
      h('button', {
        type: 'button', ref: toggle, className: 'sidebar-toggle',
        'aria-label': toggleLabel, title: toggleLabel, 'aria-expanded': String(mobile ? open : !open),
        onClick: () => { setOpen(o => !o); setFlyout(null); },
      }, mobile && open ? '✕' : '☰')),
    h('nav', { 'aria-label': label, className: 'sidebar-nav', onClick: closeOnLink },
      h(MenuState.Provider, { value: menu }, h(List, { nodes: items, className: cls('menu menu-vertical', menuClassName) }))),
    footer && h('div', { className: 'sidebar-footer' }, footer));
}
