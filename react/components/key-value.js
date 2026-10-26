import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

const blank = value => value === undefined || value === null || value === false || value === ''
  || (Array.isArray(value) && value.length === 0);

/** A definition list from [label, value] pairs, skipping empty values. Load key-value.css. */
export const KeyValue = ({ items, className = '', ...props }) =>
  h('dl', { ...props, className: cls('key-value', className) }, items
    .filter(([, value]) => !blank(value))
    .flatMap(([label, value], i) => [h('dt', { key: `t${i}` }, label), h('dd', { key: `d${i}` }, value)]));
