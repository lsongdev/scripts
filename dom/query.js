/** Return the first matching Element, preserving the platform return type. */
export const $ = (selector, root = document) => root.querySelector(selector);

/** Return matching Elements as a plain array. */
export const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector),
];

/** Evaluate an XPath expression and return its ordered snapshot as an array. */
export function xpath(expression, root = document) {
  const result = document.evaluate(
    expression,
    root,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  );

  return Array.from(
    { length: result.snapshotLength },
    (_, index) => result.snapshotItem(index),
  );
}
