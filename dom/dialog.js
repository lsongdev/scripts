const createDialog = content => {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = content;
  return dialog;
};

const createButton = ({ text, action, className = '' }) => {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = className;
  button.dataset.action = action;
  return button;
};

const createSimpleDialog = (title, content, buttons) => {
  const dialogContent = `
    <h2>${title}</h2>
    <div>${content}</div>
    <div class="dialog-buttons"></div>
  `;
  const dialog = createDialog(dialogContent);
  const buttonsContainer = dialog.querySelector('.dialog-buttons');
  buttons.forEach(button => buttonsContainer.appendChild(createButton(button)));
  return dialog;
};

const createConfirmDialog = (message, options = {}) => {
  const { title = '确认', yesText = '是', noText = '否' } = options;
  return createSimpleDialog(title, message, [
    { text: yesText, action: 'yes', className: 'confirm-yes' },
    { text: noText, action: 'no', className: 'confirm-no' }
  ]);
};

const showDialog = dialog => {
  document.body.appendChild(dialog);
  dialog.showModal();
  return new Promise((resolve) => {
    const handleClick = (event) => {
      const action = event.target.dataset.action;
      if (action) {
        dialog.close();
        resolve(action);
      }
    };
    dialog.addEventListener('click', handleClick);
    dialog.addEventListener('close', () => {
      dialog.removeEventListener('click', handleClick);
      dialog.remove();
      resolve(null);
    });
  });
};

const showConfirmDialog = async (message, options) => {
  const dialog = createConfirmDialog(message, options);
  dialog.className = 'dialog';
  const result = await showDialog(dialog);
  return result === 'yes';
};

export {
  createDialog,
  createSimpleDialog,
  createConfirmDialog,
  showDialog,
  showConfirmDialog
};
