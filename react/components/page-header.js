import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/**
 * A page's title and subtitle, with its actions to the right. back
 * (`{ href, label }`) adds a return link at the far right of the title
 * row, which stays there on narrow screens. Load page.css.
 */
export const PageHeader = ({ title, subtitle, actions, back, backLabel = 'Back', className = '', ...props }) =>
  h('header', { ...props, className: cls('page-header', back && 'page-header-with-back', className) },
    h('div', { className: 'page-title' },
      h('h1', null, title),
      subtitle && h('div', { className: 'page-subtitle' }, subtitle)),
    actions && h('div', { className: 'page-actions' }, actions),
    back && h('a', { className: 'page-back', href: back.href, title: back.label || backLabel },
      h('span', { 'aria-hidden': 'true' }, '←'), ' ', back.label || backLabel));
