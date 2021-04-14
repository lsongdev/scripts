import { uuid } from './math.js';

export const css = str => {
  const className = 'stylesheet-' + uuid();
  const style = document.createElement('style');
  style.textContent = str.replace(/:host/, `.${className}`);
  document.head.appendChild(style);
  return className;
};

export const cls = () => {
  
};
