function assertDialog(value) {
  if (!(value instanceof HTMLDialogElement)) {
    throw new TypeError('Expected an HTMLDialogElement');
  }
  return value;
}

/** Create a dialog from safe text or an existing Node. */
export function createDialog(content = '') {
  const dialog = document.createElement('dialog');
  if (content instanceof Node) dialog.append(content);
  else dialog.textContent = String(content);
  return dialog;
}

/**
 * Create a dialog from trusted HTML without sanitization.
 * Never pass untrusted input.
 */
export function createDialogFromHTMLUnsafe(html) {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = html;
  return dialog;
}

/** Bind explicit close controls and optional backdrop dismissal. */
export function bindDialog(dialog, {
  closeOnBackdrop = true,
  signal,
} = {}) {
  assertDialog(dialog);
  signal?.throwIfAborted();

  const click = event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('[data-dialog-close]');
    if (button && dialog.contains(button)) {
      event.preventDefault();
      dialog.close(button.value || button.dataset.dialogValue || '');
      return;
    }

    if (!closeOnBackdrop || event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dialog.close('cancel');
  };

  dialog.addEventListener('click', click, { signal });
  return () => dialog.removeEventListener('click', click);
}

/** Show a dialog and restore focus after it closes. */
export function showDialog(dialog, {
  initialFocus,
  modal = true,
  signal,
} = {}) {
  assertDialog(dialog);
  signal?.throwIfAborted();
  if (!dialog.isConnected) document.body.append(dialog);

  const previousFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  const abort = () => {
    if (dialog.open) dialog.close('abort');
  };
  dialog.addEventListener('close', () => {
    signal?.removeEventListener('abort', abort);
    if (previousFocus?.isConnected) previousFocus.focus();
  }, { once: true });
  signal?.addEventListener('abort', abort, { once: true });

  if (!dialog.open) modal ? dialog.showModal() : dialog.show();
  const focusTarget = typeof initialFocus === 'string'
    ? dialog.querySelector(initialFocus)
    : initialFocus;
  focusTarget?.focus();
  return dialog;
}

/** Create a semantic form-method=dialog with safe text/Node content. */
export function createSimpleDialog(title, content, buttons = []) {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';

  const heading = document.createElement('h3');
  heading.textContent = title;
  const header = document.createElement('header');
  header.className = 'dialog-header';
  header.append(heading);

  const body = document.createElement('div');
  body.className = 'dialog-body';
  if (content instanceof Node) body.append(content);
  else body.textContent = String(content);

  const footer = document.createElement('footer');
  footer.className = 'dialog-footer';
  for (const { text, value, className = '' } of buttons) {
    const button = document.createElement('button');
    button.type = 'submit';
    button.value = value;
    button.className = className;
    button.textContent = text;
    footer.append(button);
  }

  const form = document.createElement('form');
  form.method = 'dialog';
  form.append(header, body, footer);
  dialog.append(form);
  return dialog;
}

/** Show a self-cleaning confirmation dialog. */
export function confirmDialog(message, {
  title = 'Confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmClass = '',
  cancelClass = '',
  signal,
} = {}) {
  signal?.throwIfAborted();
  const dialog = createSimpleDialog(title, message, [
    { text: cancelText, value: 'cancel', className: cancelClass },
    { text: confirmText, value: 'confirm', className: confirmClass },
  ]);
  const bindings = new AbortController();
  bindDialog(dialog, { signal: bindings.signal });

  return new Promise((resolve, reject) => {
    let aborted = false;
    const abort = () => {
      aborted = true;
      bindings.abort();
      if (dialog.open) dialog.close('abort');
      dialog.remove();
      reject(signal.reason);
    };
    signal?.addEventListener('abort', abort, { once: true });
    dialog.addEventListener('close', () => {
      signal?.removeEventListener('abort', abort);
      bindings.abort();
      if (aborted) return;
      resolve(dialog.returnValue === 'confirm');
      dialog.remove();
    }, { once: true });
    showDialog(dialog, { initialFocus: '[value="cancel"]' });
  });
}
