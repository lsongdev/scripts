import { createDialog, createButton } from './dom.js';

export { createDialog } from './dom.js';

export const createSimpleDialog = (title, content, buttons) => {
  const dialog = createDialog(`
    <form method="dialog" >
      <h3>${title}</h3>
      <p>${content}</p>
      <div class="dialog-buttons"></div>
    </form>
  `);
  const buttonsContainer = dialog.querySelector('.dialog-buttons');
  buttons.forEach(({ text, action }) => {
    const button = createButton(text);
    button.dataset.action = action;
    buttonsContainer.appendChild(button);
  });
  return dialog;
};

export const createConfirmDialog = (message, options = {}) => {
  const { title = '确认?', yesText = '是', noText = '否' } = options;
  return createSimpleDialog(title, message, [
    { text: yesText, action: 'yes' },
    { text: noText, action: 'no' },
  ]);
};

export const showDialog = () => {

};

export const showConfirmDialog = () => {
  
};
