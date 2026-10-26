import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/**
 * A row of tab buttons. tabs is a list of [id, label] pairs or
 * { id, label } objects; onChange receives the chosen id. Load tabs.css.
 */
export const Tabs = ({ tabs, active, onChange, className = '', ...props }) =>
  h('nav', { role: 'tablist', ...props, className: cls('tabs', className) }, tabs.map(tab => {
    const [id, label] = Array.isArray(tab) ? tab : [tab.id, tab.label];
    return h('button', {
      key: id, type: 'button', role: 'tab', className: 'tab',
      'aria-selected': String(active === id), onClick: () => onChange?.(id),
    }, label);
  }));
