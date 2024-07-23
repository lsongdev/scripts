import { h } from '../react.js';

export const List = ({ items, children, className = '' }) => {
  return h('ul', { className: `list ${className}` },
    (items || children).map(child => h(ListItem, null, child))
  );
};

export const ListItem = ({ children, className = '' }) => {
  return h('li', { className: `list-item ${className}` }, children);
};
