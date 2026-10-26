import { h } from '../react.js';

/** size is small or large. Native button props are forwarded. Legacy type="primary" etc. remains supported. */
export const Button = ({ type = 'button', variant, size, text, children, className = '', ...props }) => {
  const native = ['button', 'submit', 'reset'].includes(type);
  const appearance = variant ?? (native ? 'normal' : type);
  const sized = size ? ` button-${size}` : '';
  return h('button', { ...props, type: native ? type : 'button', className: `button button-${appearance}${sized} ${className}`.trim() }, text ?? children);
};
