import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/** A stylesheets badge: variant is info, success, warning or danger; dot adds a status dot. */
export const Badge = ({ variant, dot = false, className = '', children, ...props }) =>
  h('span', { ...props, className: cls('badge', variant && `badge-${variant}`, className) },
    dot && h('span', { className: 'badge-dot', 'aria-hidden': 'true' }),
    children);
