function keysList(keys) {
  if (typeof keys === 'string') return [keys];
  return Array.from(keys);
}

/** Read an own-property path. Missing or blocked prototype keys return fallback. */
export function getPath(value, path, fallback, { separator = '.' } = {}) {
  const parts = Array.isArray(path) ? path : String(path).split(separator);
  let current = value;
  for (const part of parts) {
    if (part === '__proto__' || part === 'prototype' || part === 'constructor'
      || current == null || !Object.hasOwn(Object(current), part)) return fallback;
    current = current[part];
  }
  return current;
}

/** Copy selected own enumerable properties into a null-prototype record. */
export function pick(record, keys) {
  if (record == null) throw new TypeError('record is required');
  const result = Object.create(null);
  for (const key of keysList(keys)) {
    if (Object.prototype.propertyIsEnumerable.call(record, key)) result[key] = record[key];
  }
  return result;
}

/** Copy own enumerable properties except the selected keys. */
export function omit(record, keys) {
  if (record == null) throw new TypeError('record is required');
  const excluded = new Set(keysList(keys));
  const result = Object.create(null);
  for (const key of Object.keys(Object(record))) {
    if (!excluded.has(key)) result[key] = record[key];
  }
  return result;
}
