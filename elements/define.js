/** Explicitly register a custom element and return its constructor. */
export function defineElement(name, constructor, options, registry = customElements) {
  const existing = registry.get(name);
  if (existing && existing !== constructor) {
    throw new DOMException(`Custom element already defined: ${name}`, 'NotSupportedError');
  }
  if (!existing) registry.define(name, constructor, options);
  return constructor;
}
