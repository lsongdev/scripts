import { h } from '../react.js';

export const Button = ({ type = 'normal', text, children, onClick }) => {
  text = text || children;
  return h('button', { className: `button button-${type}`, onClick }, text)
};
