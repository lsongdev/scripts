

export const querySelector = (el, selector) =>
  el.querySelector(selector);

export const querySelectorAll = (el, selector) =>
  el.querySelectorAll(selector);

export const addEventListener = (el, type, fn, options) => {
  el.addEventListener(type, fn, options);
  return () => removeEventListener(el, type, fn, options);
};

export const removeEventListener = (el, type, fn, options) =>
  el.removeEventListener(type, fn, options);

export const ready = fn => {
  if(/loaded|complete/.test(document.readyState)) {
    return fn();
  }
  return addEventListener(document, 'DOMContentLoaded', fn);
};