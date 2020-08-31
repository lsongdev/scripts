
const uuid = () =>
  (Math.random() * 1e9 | 0).toString(16)

export const css = str => {
  const className = 'stylesheet-' + uuid();
  const style = document.createElement('style');
  style.textContent = str.replace(/:host/, `.${className}`);
  document.head.appendChild(style);
  return className;
};

export const cls = () => {
  
};