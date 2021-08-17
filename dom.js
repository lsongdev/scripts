
export const querySelector = (selector, el = document) =>
  el.querySelector(selector);

export const querySelectorAll = (selector, el = document) =>
  [...el.querySelectorAll(selector)];

export const getElementFromPoint = (x, y) => {
  return document.elementsFromPoint(x, y);
};

export const xpath = (path, node = document) => {
  const result = [];
  const nodesSnapshot = document.evaluate(
    path,
    node,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  );
  for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
    result.push(nodesSnapshot.snapshotItem(i));
  }
  return result;
};

export const closest = (selector, el = document) =>
  el.closest(selector);

export const ready = (fn, unload) => {
  if (/loaded|complete/.test(document.readyState))
    return fn();

  unload && document.addEventListener('onbeforeunload', unload);
  return document.addEventListener('DOMContentLoaded', fn);
};

export const createTreeWalker = (root, ...options) => {
  return document.createTreeWalker(root, ...options)
};

export const createTemplate = html => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

export const importNode = (node, deep = false) => {
  return document.importNode(node, deep);
};

export const createTextNode = text => {
  return document.createTextNode(text);
};

export const appendChildren = (element, children) => {
  switch (true) {
    case typeof children === 'string':
      element.appendChild(createTextNode(children));
      break;
    case Array.isArray(children):
      children.forEach(child => appendChildren(element, child));
      break;
    default:
      element.appendChild(children);
      break;
  }
  return element;
};

export const createElement = (type, props, children) => {
  const element = document.createElement(type);
  for (const [key, value] of Object.entries(props)) {
    element[key] = value;
  }
  return appendChildren(element, children);
};

export const createLink = (text, to) => {
  return createElement('a', { href: to }, text);
};

export const getPosition = dom => {
  return dom.getBoundingClientRect();
};

export const setPosition = (dom, rect) => {
  const { x, y } = rect;
  dom.style.top = y + 'px';
  dom.style.left = x + 'px';
  return rect;
};

export const setPositionWithDelta = (dom, delta) => {
  const rect = getPosition(dom);
  return setPosition(dom, {
    x: rect.x + delta.x,
    y: rect.y + delta.y,
  });
};

export const setPositionFromEvent = e => {
  return setPositionWithDelta(e.target, {
    x: e.movementX,
    y: e.movementY,
  });
};

export const getPositionFromEvent = e => {
  const a = {
    x: e.offsetX,
    y: e.offsetY,
  };
  const b = {
    x: e.clientX,
    y: e.clientY,
  };
  const c = {
    x: e.scrollX,
    y: e.scrollY,
  };
  return { a, b, c };
};

export const attachNode = (where, what) => {
  return where.replaceChildren(...what);
};
