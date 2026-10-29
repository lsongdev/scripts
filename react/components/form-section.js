import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/** A titled group of fields, with an optional description. Load field.css. */
export const FormSection = ({ title, description, className = '', children, ...props }) =>
  h('fieldset', { ...props, className: cls('form-section', className) },
    h('legend', null, title),
    description && h('p', { className: 'form-section-help' }, description),
    children);
