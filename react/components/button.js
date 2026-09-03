import { h } from '../react.js';

/** Native button props are forwarded. Legacy type="primary" etc. remains supported. */
export const Button = ({ type = 'button', variant, text, children, className = '', ...props }) => {
  const native = ['button', 'submit', 'reset'].includes(type);
  const appearance = variant ?? (native ? 'normal' : type);
  return h('button', { ...props, type: native ? type : 'button', className: `button button-${appearance} ${className}`.trim() }, text ?? children);
};
