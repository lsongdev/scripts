import { h } from '../react.js';
import { cls } from '../../dom.js';

export const List = ({ items, children, className = '', ...opts }) => {
  return h('ul', { className: cls('list', className), ...opts },
    children || items.map(item => h(ListItem, null, item))
  );
};

export const ListItem = ({
  children,
  className = '',
  leadingContent,
  headlineContent,
  supportingContent,
  trailingContent,
  ...props
}) => {
  return h('li', { className: cls('list-item', className), ...props }, children || [
    leadingContent && h('span', { className: 'list-item-leading' }, leadingContent),
    h('div', { className: 'list-item-content' }, [
      headlineContent && h('div', { className: 'list-item-headline' }, headlineContent),
      supportingContent && h('span', { className: 'list-item-supporting' }, supportingContent),
    ]),
    trailingContent && h('span', { className: 'list-item-trailing' }, trailingContent),
  ]);
};
