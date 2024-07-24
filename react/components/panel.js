import { h } from '../react.js';
import { cls } from '../../dom.js';

export const Panel = ({ className = '', title, header, footer, children }) => {
  return h('div', { className: cls('panel', className) },
    h('div', { className: 'panel-header' }, [title, header]),
    h('div', { className: 'panel-body' }, children),
    footer && h('div', { className: 'panel-footer' }, footer),
  );
};
