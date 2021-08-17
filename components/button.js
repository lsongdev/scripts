import { h } from './react.js';

export const Button = ({ type = 'normal', text, children }) => {
    text = text || children;
    return h('button', { className: `button button-${type}` }, text)
};
