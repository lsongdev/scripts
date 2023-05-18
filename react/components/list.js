import { h } from '../react.js';

export const List = ({ items, children }) => {
  return h('ul', { className: 'list' },
    (items || children).map(child => h(ListItem, null, child))
  );
};

export const ListItem = ({ children }) => {
  return h('li', { className: 'list-item' }, children);
};
