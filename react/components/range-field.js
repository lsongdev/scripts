import { h } from '../react.js';

/** A labeled, controlled or uncontrolled native range with an optional formatted readout. */
export const RangeField = ({ id, label, value, defaultValue, formatValue = String, className = '', inputClassName = '', ...props }) =>
  h('label', { className: `range-field ${className}`.trim(), htmlFor: id }, [
    h('span', { className: 'range-field-label' }, [label,
      value != null && h('output', { htmlFor: id }, formatValue(value)),
    ]),
    h('input', { ...props, id, type: 'range', value, defaultValue, 'aria-label': props['aria-label'] ?? label, className: `input ${inputClassName}`.trim() }),
  ]);
