import { h } from '../react.js';

export const ProgressBar = ({ value, max, className = '', children }) => {
  const percentage = (value / max) * 100;
  return h('div', { className: `progress-bar ${className}` }, [
    h('div', {
      className: `progress-bar-inner`,
      style: { width: `${percentage}%` }
    }, children)
  ]);
};
