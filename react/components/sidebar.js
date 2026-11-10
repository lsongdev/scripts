import { createContext, h, useContext, useEffect, useId, useRef, useState } from '../react.js';
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
  const { collapsible, collapsed, toggle } = useContext(MenuState);
  const id = useId();
  const heading = `${id}-heading`;
  const list = `${id}-list`;
  const expanded = !collapsed.has(key(node));
  return h('li', { className: 'menu-group' },
    collapsible
      ? h('button', {
        type: 'button', id: heading, className: 'menu-heading',
        'aria-expanded': String(expanded), 'aria-controls': list,
        onClick: () => toggle(key(node)),
      }, h('span', null, node.title))
      : h('span', { id: heading, className: 'menu-heading' }, node.title),
    h(List, { nodes: node.items, id: list, 'aria-labelledby': heading, hidden: collapsible && !expanded }));
}

const Node = ({ node }) => isGroup(node)
  ? h(Group, { node })
  : h('li', null, h(Link, { node }), node.items?.length > 0 && h(List, { nodes: node.items }));

/**
 * Side navigation: a brand, a vertical menu and an optional footer. Load
 * sidebar.css and menu.css.
 *
 * items is the menu tree. Links are `{ href, title, icon, badge, active,
 * items }`; groups are `{ id, title, items, open }` and render as
 * `<li class="menu-group">` holding a `.menu-heading` and their own list.
 * collapsible makes the headings disclosure buttons: groups start open
 * unless `open: false`, and the groups holding the active link open when it
 * becomes active. The toggle collapses the sidebar to its icons on wide
 * screens (headings hidden, so every group shows) and opens it as a menu on
 * narrow ones, where following a link or pressing Escape closes it again.
 * menuClassName picks the menu's look, e.g. 'menu-tree' (menu.css) to draw
 * group headings as items.
 */
export function Sidebar({
  brand, href = '#/', mark, items = [], footer, collapsible = false, menuClassName = '', label = 'Menu',
  openLabel = 'Open menu', closeLabel = 'Close menu',
  collapseLabel = 'Collapse menu', expandLabel = 'Expand menu',
  className = '', ...props
}) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => globalThis.matchMedia?.(MOBILE).matches ?? false);
  const [collapsed, setCollapsed] = useState(() => new Set(groupKeys(items, n => n.open === false)));
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
  const menu = { collapsible: collapsible && !iconsOnly, collapsed, toggle: toggleGroup };
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
        onClick: () => setOpen(o => !o),
      }, mobile && open ? '✕' : '☰')),
    h('nav', { 'aria-label': label, className: 'sidebar-nav', onClick: closeOnLink },
      h(MenuState.Provider, { value: menu }, h(List, { nodes: items, className: cls('menu menu-vertical', menuClassName) }))),
    footer && h('div', { className: 'sidebar-footer' }, footer));
}
