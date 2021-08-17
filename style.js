import { randomId } from './math.js';

/**
 * @param {*} content 
 * @param {*} className 
 * @returns 
 */
export const style = (content, className = 'stylesheet-' + randomId(6)) => {
  if (typeof content !== 'string') {
    content = Object.entries(content).map(([key, value]) => `${key}: ${value}`).join('; ');
  }
  const style = document.createElement('style');
  style.textContent = `.${className} {${content}}`;
  document.head.appendChild(style);
  return className;
};

export const cls = (...args) => {
  return args.reduce((className, item) => {
    switch (typeof item) {
      case 'string':
        return className + ' ' + item;
      case 'object':
        return;
    }
  }, '');
};