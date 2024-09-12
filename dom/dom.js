
export const querySelector = (selector, el = document) =>
  el.querySelector(selector);

export const querySelectorAll = (selector, el = document) =>
  [...el.querySelectorAll(selector)];

export const getElementFromPoint = (x, y) => {
  return document.elementsFromPoint(x, y);
};

export const removeEventListener = (dom, type, handler) => {
  if (typeof dom === 'string')
    dom = querySelector(dom);
  return dom.removeEventListener(type, handler);
};

export const addEventListener = (dom, type, handler) => {
  if (typeof dom === 'string')
    dom = querySelector(dom);
  dom.addEventListener(type, handler);
  return () => removeEventListener(dom, type, handler);
}

export const filterEvent = (selector, handler) => {
  return e => e.target.matches(selector) && handler(e);
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

export const ready = (fn) => {
  const { promise, resolve } = Promise.withResolvers();

  const readyHandler = () => {
    resolve();
    if (typeof fn === 'function') fn();
  };

  if (/loaded|complete/.test(document.readyState)) {
    readyHandler();
  } else {
    document.addEventListener('DOMContentLoaded', readyHandler, { once: true });
  }

  return promise;
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
  if (!children) return element;
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

export const createButton = text => {
  const button = document.createElement('button');
  button.textContent = text;
  return button;
};

/**
 * Creates an input element with the given attributes.
 * @param {Object} attrs - An object of attribute key-value pairs.
 * @returns {HTMLInputElement} The created input element.
 */
export const createInput = (attrs) => {
  return createElement('input', attrs);
};

/**
 * Creates a range input element with the given attributes.
 * @param {Object} attrs - An object of attribute key-value pairs.
 * @returns {HTMLInputElement} The created range input element.
 */
export const createRangeInput = (attrs) => {
  return createInput({ ...attrs, type: 'range' });
};

/**
 * Creates a textarea element with the given attributes.
 * @param {Object} attrs - An object of attribute key-value pairs.
 * @returns {HTMLTextAreaElement} The created textarea element.
 */
export const createTextarea = (attrs) => {
  return createElement('textarea', attrs);
};

/**
 * Creates a select element with the given attributes and options.
 * @param {Object} attrs - An object of attribute key-value pairs.
 * @param {Array} options - An array of option objects or strings.
 * @returns {HTMLSelectElement} The created select element.
 */
export const createSelect = (attrs, options) => {
  const select = createElement('select', attrs);
  const optionElements = createSelectOptions(options);
  optionElements.forEach(option => select.appendChild(option));
  return select;
};

/**
 * Creates an array of option elements from the given options.
 * @param {Array} options - An array of option objects or strings.
 * @returns {Array<HTMLOptionElement>} An array of created option elements.
 */
export const createSelectOptions = (options) => {
  return options.map(option => createElement('option', {
    value: option.value ?? option,
    textContent: option.label ?? option
  }));
};

/**
 * Creates a radio input element with the given field configuration.
 * @param {Object} field - The field configuration object.
 * @returns {HTMLInputElement} The created radio input element.
 */
export const createRadio = (attrs) => {
  return createInput({ ...attrs, type: 'radio' });
};

/**
 * Creates a checkbox input element with the given field configuration.
 * @param {Object} field - The field configuration object.
 * @returns {HTMLInputElement} The created checkbox input element.
 */
export const createCheckbox = (attrs) => {
  return createInput({ ...attrs, type: 'checkbox' });
};

export const createLabel = (text, forId) => {
  return createElement('label', { htmlFor: forId, textContent: text });
};

export function createListItem({ leadingContent, headlineContent, supportingContent, trailingContent }) {
  const li = document.createElement('li');
  li.className = 'list-item';

  const leadingDiv = document.createElement('div');
  leadingDiv.className = 'list-item-leading';
  leadingDiv.textContent = leadingContent;
  li.appendChild(leadingDiv);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'list-item-content';

  const headlineDiv = document.createElement('div');
  headlineDiv.className = 'list-item-headline';
  headlineDiv.textContent = headlineContent;
  contentDiv.appendChild(headlineDiv);

  if (supportingContent) {
    const supportingDiv = document.createElement('div');
    supportingDiv.className = 'list-item-supporting';
    supportingDiv.textContent = supportingContent;
    contentDiv.appendChild(supportingDiv);
  }

  li.appendChild(contentDiv);

  const trailingDiv = document.createElement('div');
  trailingDiv.className = 'list-item-trailing';
  trailingDiv.textContent = trailingContent;
  li.appendChild(trailingDiv);

  return li;
}

export const createDialog = content => {
  const dialog = document.createElement('dialog');
  dialog.innerHTML = content;
  return dialog;
};
