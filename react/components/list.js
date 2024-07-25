import { h } from '../react.js';
import { cls } from '../../dom.js';

export const List = ({ items, children, className = '', ...opts }) => {
  return h('ul', { className: cls('list', className), ...opts },
    children || items.map(item => h(ListItem, null, item))
  );
};

export const ListItem = ({ children, className = '' }) => {
  return h('li', { className: cls('list-item', className) }, children);
};
