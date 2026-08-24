/** Construct a standard CSSStyleSheet and synchronously replace its rules. */
export function createStyleSheet(cssText, {
  CSSStyleSheet: StyleSheet = globalThis.CSSStyleSheet,
} = {}) {
  if (typeof cssText !== 'string') throw new TypeError('cssText must be a string');
  if (typeof StyleSheet !== 'function') throw new ReferenceError('CSSStyleSheet is required');
  const sheet = new StyleSheet();
  sheet.replaceSync(cssText);
  return sheet;
}

/** Adopt sheets without duplicates and return cleanup that removes only newly added sheets. */
export function adoptStyleSheets(root, sheets) {
  if (!root || !Array.isArray(root.adoptedStyleSheets)) {
    throw new TypeError('root must support adoptedStyleSheets');
  }
  const requested = Array.from(sheets);
  const existing = new Set(root.adoptedStyleSheets);
  const added = requested.filter(sheet => !existing.has(sheet));
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, ...added];
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    const remove = new Set(added);
    root.adoptedStyleSheets = root.adoptedStyleSheets.filter(sheet => !remove.has(sheet));
  };
}
