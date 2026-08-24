/** Append nested Nodes and primitive text values to an Element. */
export function appendChildren(element, children) {
  if (children == null || children === false) return element;

  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    if (child == null || child === false) continue;
    element.append(child instanceof Node ? child : String(child));
  }
  return element;
}

/** Create an Element, assign standard DOM properties, and append children. */
export function createElement(name, properties = {}, children) {
  const element = document.createElement(name);
  Object.assign(element, properties);
  return appendChildren(element, children);
}

/**
 * Parse trusted HTML into a DocumentFragment.
 *
 * This function performs no sanitization. Never pass untrusted input.
 */
export function parseHTMLUnsafe(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}
