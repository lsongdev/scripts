import { h } from '../react.js';

export const Panel = ({ className = '', title, footer, children }) => {
  return h('div', { className: `panel ${className}` },
    h('div', { className: 'panel-header' }, title),
    h('div', { className: 'panel-body' }, children),
    footer && h('div', { className: 'panel-footer' }, footer)
  );
};
