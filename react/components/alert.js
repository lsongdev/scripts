import { h } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/**
 * A stylesheets alert. variant is info, success, warning or danger; an
 * error without children shows its message as a danger alert. Renders
 * nothing when there is neither.
 */
export const Alert = ({ variant, error, className = '', children, ...props }) => {
  if (!error && (children == null || children === false || children === '')) return null;
  const tone = variant ?? (error ? 'danger' : 'info');
  return h('div', {
    role: tone === 'danger' ? 'alert' : 'status',
    ...props,
    className: cls('alert', tone !== 'info' && `alert-${tone}`, className),
  }, children ?? error?.message ?? String(error));
};
