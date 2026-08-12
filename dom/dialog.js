import { createDialog as createDialogElement, createButton } from './dom.js';

const bindings = new WeakMap();

const resolveDialog = dialog => {
  const element = typeof dialog === 'string'
    ? document.querySelector(dialog)
    : dialog;
  if (!(element instanceof HTMLDialogElement)) {
    throw new TypeError('Expected a dialog element or selector');
  }
  return element;
};

const resolveFocusTarget = (dialog, target) => {
  if (typeof target === 'string') return dialog.querySelector(target);
  return target;
};

/**
 * Create a dialog from trusted HTML or a DOM node.
 * String content is interpreted as HTML for backward compatibility.
 */
export const createDialog = (content = '') => {
  const dialog = createDialogElement('');
  dialog.classList.add('dialog');
  if (content instanceof Node) dialog.append(content);
  else dialog.innerHTML = content;
  return dialog;
};

/**
 * Bind close buttons and optional backdrop dismissal to a static dialog.
 * Calling this repeatedly for the same dialog is safe.
 */
export const bindDialog = (dialog, options = {}) => {
  const element = resolveDialog(dialog);
  const previous = bindings.get(element);
  if (previous) return previous;

  const { closeOnBackdrop = true } = options;
  const onClick = event => {
    const target = event.target instanceof Element ? event.target : null;
    const closeButton = target?.closest('[data-dialog-close], [data-close-dialog]');
    if (closeButton && element.contains(closeButton)) {
      event.preventDefault();
      element.close(closeButton.value || closeButton.dataset.dialogValue || '');
      return;
    }

    if (!closeOnBackdrop || event.target !== element) return;
    const bounds = element.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) element.close('cancel');
  };

  element.addEventListener('click', onClick);
  const binding = {
    dialog: element,
    destroy() {
      element.removeEventListener('click', onClick);
      bindings.delete(element);
    },
  };
  bindings.set(element, binding);
  return binding;
};

export const showDialog = (dialog, options = {}) => {
  const element = resolveDialog(dialog);
  const { initialFocus, modal = true } = options;
  bindDialog(element, options);
  if (!element.isConnected) document.body.append(element);
  const previousFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  element.addEventListener('close', () => {
    if (previousFocus?.isConnected) previousFocus.focus();
  }, { once: true });
  if (!element.open) modal ? element.showModal() : element.show();
  const focusTarget = resolveFocusTarget(element, initialFocus);
  if (focusTarget instanceof HTMLElement) focusTarget.focus();
  return element;
};

export const closeDialog = (dialog, returnValue = '') => {
  const element = resolveDialog(dialog);
  if (element.open) element.close(returnValue);
  return element;
};

export const createSimpleDialog = (title, content, buttons = []) => {
  const heading = document.createElement('h3');
  heading.textContent = title;

  const header = document.createElement('div');
  header.className = 'dialog-header';
  header.append(heading);

  const body = document.createElement('div');
  body.className = 'dialog-body';
  if (content instanceof Node) body.append(content);
  else body.textContent = content;

  const footer = document.createElement('div');
  footer.className = 'dialog-footer dialog-buttons';
  buttons.forEach(({ text, action, className = 'button' }) => {
    const button = createButton(text);
    button.type = 'submit';
    button.value = action;
    button.dataset.action = action;
    button.className = className;
    footer.append(button);
  });

  const form = document.createElement('form');
  form.method = 'dialog';
  form.append(header, body, footer);
  return createDialog(form);
};

export const createConfirmDialog = (message, options = {}) => {
  const {
    title = '确认?',
    yesText = '是',
    noText = '否',
    yesClassName = 'button button-primary',
    noClassName = 'button',
  } = options;
  return createSimpleDialog(title, message, [
    { text: noText, action: 'no', className: noClassName },
    { text: yesText, action: 'yes', className: yesClassName },
  ]);
};

export const showConfirmDialog = (message, options = {}) => {
  const dialog = createConfirmDialog(message, options);
  return new Promise(resolve => {
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'yes');
      bindings.get(dialog)?.destroy();
      dialog.remove();
    }, { once: true });
    showDialog(dialog, { initialFocus: '[value="no"]' });
  });
};
