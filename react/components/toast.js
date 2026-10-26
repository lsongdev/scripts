import { h, useEffect, useRef, useState } from '../react.js';

let toastListener = () => {};
let toastSequence = 0;

/** Show a short message in the Toaster. variant is info, success or danger. */
export function toast(message, variant = 'info') {
  toastListener({ id: ++toastSequence, message, variant });
}

/**
 * Shows toasts for a few seconds, danger ones for longer. The stack is a
 * manual popover, re-shown on each change, so it stays above modal
 * dialogs. Mount one per application; load toast.css.
 */
export function Toaster({ duration = 3500, dangerDuration = 8000 }) {
  const ref = useRef(null);
  const [items, setItems] = useState([]);
  useEffect(() => {
    toastListener = item => {
      setItems(list => [...list, item]);
      setTimeout(() => setItems(list => list.filter(i => i.id !== item.id)), item.variant === 'danger' ? dangerDuration : duration);
    };
    return () => { toastListener = () => {}; };
  }, [duration, dangerDuration]);
  useEffect(() => {
    const el = ref.current;
    if (!el?.showPopover) return;
    if (el.matches(':popover-open')) el.hidePopover();
    if (items.length) el.showPopover();
  }, [items]);
  return h('div', { ref, className: 'toasts', popover: 'manual', 'aria-live': 'polite' },
    items.map(i => h('div', { key: i.id, className: i.variant === 'info' ? 'toast' : `toast toast-${i.variant}` }, i.message)));
}
