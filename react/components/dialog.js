import { h, useRef, useEffect } from '../react.js';

/** Controlled native modal; the owner updates open in onClose (including Escape). */
export function Dialog({ open = false, onClose, onCancel, className = '', children, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  return h('dialog', { ...props, ref, className: `dialog ${className}`.trim(), onClose, onCancel }, children);
}
