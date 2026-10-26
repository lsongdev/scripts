import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/**
 * A table that scrolls sideways on narrow screens instead of wrapping its
 * cells. Children are the table's rows and sections; framed (the default)
 * draws a border for a table standing on its own, and false suits one
 * inside a card. table.css.
 */
export const Table = ({ framed = true, className = '', children, ...props }) =>
  h('div', { className: cls('table-scroll', framed && 'table-framed') },
    h('table', { ...props, className: cls('table', className) }, children));
