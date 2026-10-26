import { h, useState } from '../react.js';
import { Dialog } from './dialog.js';
import { Alert } from './alert.js';
import { Check } from './field.js';

/**
 * A button that asks in a dialog before running onConfirm(checked). An
 * optional checkbox offers a variant of the action (e.g. "also delete
 * volumes"). onConfirm may return a promise; its error stays in the dialog.
 */
export function ConfirmButton({
  label,
  title,
  description,
  checkbox,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  className = 'button',
  onConfirm,
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const start = () => { setChecked(false); setError(null); setOpen(true); };
  const submit = async () => {
    setRunning(true);
    setError(null);
    try {
      await onConfirm(checked);
      setOpen(false);
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
    }
  };
  return [
    h('button', { type: 'button', className: `${className} ${danger ? 'button-danger' : ''}`.trim(), onClick: start }, label),
    open && h(Dialog, {
      open, title, onClose: () => setOpen(false), closeLabel: cancelLabel,
      footer: [
        h('button', { type: 'button', className: 'button', onClick: () => setOpen(false) }, cancelLabel),
        h('button', { type: 'button', className: `button ${danger ? 'button-danger' : 'button-primary'}`, disabled: running, onClick: submit }, confirmLabel),
      ],
    },
    h(Alert, { error }),
    description && h('p', null, description),
    checkbox && h(Check, { label: checkbox, checked, onChange: e => setChecked(e.currentTarget.checked) })),
  ];
}
