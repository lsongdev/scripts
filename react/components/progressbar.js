import { h } from '../react.js';

/**
 * A bar filled to value out of max, exposed as a progressbar to assistive
 * technology; `label` names it. An unknown or zero max shows an empty bar.
 * progressbar.css.
 */
export const ProgressBar = ({ value = 0, max = 100, label, className = '', children, ...props }) => {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return h('div', {
    role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max,
    'aria-valuenow': Math.min(max, Math.max(0, value)), ...props,
    className: `progress-bar ${className}`.trim(),
  }, h('div', { className: 'progress-bar-inner', style: { width: `${ratio * 100}%` } }, children));
};
