
export const querySelector = (selector, el = document) =>
  el.querySelector(selector);

export const querySelectorAll = (selector, el = document) =>
  el.querySelectorAll(selector);

/**
 * addEventListener
 * @param {*} el 
 * @param {*} type 
 * @param {*} filter 
 * @param {*} fn 
 * @param {*} options 
 */
export const addEventListener = (el, expr, fn, options) => {
  el = el || document;
  if (typeof el === 'string') el = querySelector(el);
  const [type, filter] = expr.split(',');
  const cb = e => {
    if (typeof filter === 'string') {
      fn && e.target.matches(filter) && fn.call(el, e);
    } else {
      fn && fn.call(el, e);
    }
  };
  el.addEventListener(type, cb, options);
  return removeEventListener.bind(null, el, type, cb);
};

export const removeEventListener = (el, type, fn, options) => {
  if (typeof el === 'string') el = querySelector(el);
  return el.removeEventListener(type, fn, options);
};

export const ready = fn => {
  if (/loaded|complete/.test(document.readyState))
    return fn();
  return addEventListener(document, 'DOMContentLoaded', fn);
};

export const closest = (el, selector) => {
  return el.closest(selector);
};

export const addClass = () => {

};

export const removeClass = () => {

};

export const toggleClass = () => {

};
