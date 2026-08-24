/** Compose class names for the optional Preact adapter. */
export function classes(...values) {
  const names = [];
  const append = value => {
    if (!value) return;
    if (typeof value === 'string') names.push(value);
    else if (Array.isArray(value)) value.forEach(append);
    else if (typeof value === 'object') {
      for (const [name, enabled] of Object.entries(value)) {
        if (enabled) names.push(name);
      }
    }
  };
  values.forEach(append);
  return [...new Set(names)].join(' ');
}
