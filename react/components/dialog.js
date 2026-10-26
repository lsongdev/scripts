import { h, useRef, useEffect, useState } from '../react.js';
import { bindDialog, showDialog } from '../../dom/dialog.js';

/**
 * Controlled native modal; the owner updates open in onClose, which also
 * runs for Escape, a [data-dialog-close] button and a backdrop click.
 * With title or footer the content goes into the stylesheets
 * header/body/footer slots, with a close button; otherwise children fill
 * the dialog.
 */
export function Dialog({
  open = false,
  onClose,
  onCancel,
  title,
  footer,
  closeLabel = 'Close',
  closeOnBackdrop = true,
  className = '',
  children,
  ...props
}) {
  const ref = useRef(null);
  useEffect(() => {
    const bindings = new AbortController();
    bindDialog(ref.current, { closeOnBackdrop, signal: bindings.signal });
    return () => bindings.abort();
  }, [closeOnBackdrop]);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) showDialog(dialog);
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  // Unrendering an open dialog closes it, so focus returns to the page.
  useEffect(() => () => { if (ref.current?.open) ref.current.close(); }, []);

  const slots = title != null || footer != null;
  const label = props['aria-label'] ?? (typeof title === 'string' ? title : undefined);
  return h('dialog', { ...props, 'aria-label': label, ref, className: `dialog ${className}`.trim(), onClose, onCancel },
    slots ? [
      h('header', { className: 'dialog-header' }, h('h2', null, title)),
      h('button', { type: 'button', className: 'dialog-close', 'aria-label': closeLabel, 'data-dialog-close': '' }, '×'),
      h('div', { className: 'dialog-body' }, children),
      footer != null && h('footer', { className: 'dialog-footer' }, footer),
    ] : children);
}

let dialogListener = () => {};
let dialogSequence = 0;

/**
 * Render render(close) in the nearest DialogHost until close is called, so a
 * dialog can be opened from an event handler or after an async step.
 */
export function openDialog(render) {
  const id = ++dialogSequence;
  const close = () => dialogListener({ id, close: true });
  dialogListener({ id, render: () => render(close) });
  return close;
}

/** Where dialogs opened with openDialog render; mount one per application. */
export function DialogHost() {
  const [dialogs, setDialogs] = useState([]);
  useEffect(() => {
    dialogListener = next => setDialogs(list => (next.close ? list.filter(d => d.id !== next.id) : [...list, next]));
    return () => { dialogListener = () => {}; };
  }, []);
  return dialogs.map(d => h('div', { key: d.id }, d.render()));
}
