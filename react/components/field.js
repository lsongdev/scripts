import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/** A labelled control with a hint, or an error in its place. Load field.css. */
export const Field = ({ label, hint, error, required = false, className = '', children, ...props }) =>
  h('label', { ...props, className: cls('field', error && 'field-invalid', className) },
    h('span', { className: 'field-label' }, label,
      required && h('span', { className: 'field-required', 'aria-hidden': 'true' }, '*')),
    children,
    error ? h('span', { className: 'field-error' }, error) : hint && h('span', { className: 'field-hint' }, hint));

/** A checkbox or radio with its label to the right. Load field.css. */
export const Check = ({ label, className = '', ...inputProps }) =>
  h('label', { className: cls('field-check', className) },
    h('input', { type: 'checkbox', ...inputProps }),
    label);

/**
 * Edits a list of strings, always keeping one empty row to type in.
 * Load field.css.
 */
export function ListInput({ values, onChange, placeholder, inputClassName = 'input', removeLabel = 'Remove' }) {
  const rows = values.length && values[values.length - 1] === '' ? values : [...values, ''];
  const set = (i, value) => onChange(rows
    .map((row, j) => (j === i ? value : row))
    .filter((row, j, all) => row !== '' || j === all.length - 1));
  return h('div', { className: 'list-input' }, rows.map((value, i) =>
    h('div', { className: 'list-input-row', key: i },
      h('input', { className: inputClassName, value, placeholder, onInput: e => set(i, e.currentTarget.value) }),
      value && h('button', {
        type: 'button', className: 'button button-ghost', 'aria-label': removeLabel,
        onClick: () => onChange(rows.filter((_, j) => j !== i)),
      }, '×'))));
}
