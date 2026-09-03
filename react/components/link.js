import { h } from '../react.js';

/** Preserve `to` while accepting native anchor attributes (href, target, ARIA, etc.). */
export const Link = ({ to = 'javascript:void(0)', href = to, children, ...props }) => {
  return h('a', { ...props, href }, children)
};
