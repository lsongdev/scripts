import { h } from '../react.js';
import { cls } from '../../dom.js';

export const Panel = ({ className = '', title, header, footer, children, ...opts }) => {
  return h('div', { className: cls('panel', className), ...opts },
    h('div', { className: 'panel-header' }, [
      title && h('span', { className: 'panel-title' }, title), 
      header
    ]),
    h('div', { className: 'panel-body' }, children),
    footer && h('div', { className: 'panel-footer' }, footer),
  );
};
