import { h, useRef, useEffect } from '../react.js';
import { cls, createListItem } from '../../dom.js';

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
}) => {
  const ref = useRef();
  useEffect(() => {
    if (children) return;
    const listItemElement = createListItem({
      leadingContent,
      headlineContent,
      supportingContent,
      trailingContent
    });
    if (ref.current) {
      ref.current.parentNode.replaceChild(listItemElement, ref.current);
    }
    return () => {
      if (listItemElement.parentNode) {
        listItemElement.parentNode.replaceChild(ref.current, listItemElement);
      }
    };
  }, [leadingContent, headlineContent, supportingContent, trailingContent]);
  return h('li', { ref, className: cls('list-item', className) }, children);
};
