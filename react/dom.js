import { isStr } from './reconcile.js';

const defaultObj = {};
const jointIter = (aProps, bProps, callback) => {
  aProps = aProps || defaultObj;
  bProps = bProps || defaultObj;
  Object.keys(aProps).forEach(k => callback(k, aProps[k], bProps[k]));
  Object.keys(bProps).forEach(k => !aProps.hasOwnProperty(k) && callback(k, undefined, bProps[k]));
};

export const updateElement = (dom, aProps, bProps) => {
  jointIter(aProps, bProps, (name, a, b) => {
    if (a === b || name === 'children') {
      // do nothing, see else ...
    } else if (name === 'style' && !isStr(b)) {
      jointIter(a, b, (styleKey, aStyle, bStyle) => {
        if (aStyle !== bStyle) dom[name][styleKey] = bStyle || '';
      });
    } else if (name[0] === 'o' && name[1] === 'n') {
      name = name.slice(2).toLowerCase();
      if (a) dom.removeEventListener(name, a);
      dom.addEventListener(name, b);
    } else if (name in dom && !(dom instanceof SVGElement)) {
      dom[name] = b || '';
    } else if (b == null || b === false) {
      dom.removeAttribute(name);
    } else {
      dom.setAttribute(name, b);
    }
  });
};

export const createElement = (fiber) => {
  const dom = fiber.type === '#text'
    ? document.createTextNode('')
    : fiber.lane & 16
      ? document.createElementNS('http://www.w3.org/2000/svg', fiber.type)
      : document.createElement(fiber.type);
  updateElement(dom, {}, fiber.props);
  return dom;
};
