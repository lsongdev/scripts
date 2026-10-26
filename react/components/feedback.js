import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/** A small spinning ring. Load spinner.css. */
export const Spinner = ({ className = '', ...props }) =>
  h('span', { 'aria-hidden': 'true', ...props, className: cls('spinner', className) });

/** A centred loading message. Load spinner.css. */
export const Loading = ({ children = 'Loading…', className = '', ...props }) =>
  h('div', { 'aria-busy': 'true', ...props, className: cls('loading', className) }, h(Spinner), children);

/** An empty state message (utils.css). */
export const Empty = ({ className = '', children, ...props }) =>
  h('div', { ...props, className: cls('empty', className) }, children);
