import { h } from './react.js';

export const Link = ({ to = 'javascript:void(0)', children, onClick }) => {
  return h('a', { href: to, onClick }, children)
};
