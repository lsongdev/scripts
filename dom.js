
export const querySelector = (selector, el = document) =>
  el.querySelector(selector);

export const querySelectorAll = (selector, el = document) =>
  el.querySelectorAll(selector);

export const addEventListener = (el, type, fn, options) => {
  if (typeof el === 'string') el = querySelector(el);
  el.addEventListener(type, fn, options);
  return () => removeEventListener(el, type, fn, options);
};

export const removeEventListener = (el, type, fn, options) => {
  if (typeof el === 'string') el = querySelector(el);
  el.removeEventListener(type, fn, options);
}

export const ready = fn => {
  if (/loaded|complete/.test(document.readyState))
    return fn();
  return addEventListener(document, 'DOMContentLoaded', fn);
};
