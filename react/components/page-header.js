import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/** A page's title and subtitle, with its actions to the right. Load page.css. */
export const PageHeader = ({ title, subtitle, actions, className = '', ...props }) =>
  h('header', { ...props, className: cls('page-header', className) },
    h('div', { className: 'page-title' },
      h('h1', null, title),
      subtitle && h('div', { className: 'page-subtitle' }, subtitle)),
    actions && h('div', { className: 'page-actions' }, actions));
