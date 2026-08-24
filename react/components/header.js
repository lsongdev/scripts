import { h } from '../react.js';

export const Header = ({ title }) => {
  return h('header', { className: 'header' },
    h('h1', null, title)
  );
};
