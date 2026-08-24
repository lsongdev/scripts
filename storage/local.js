/**
 * Create a synchronous, namespaced view over a standard Storage object.
 * Values remain strings, matching the platform. JSON policy belongs in a
 * separate workflow rather than being hidden in this primitive.
 *
 * @param {{ namespace?: string, storage?: Storage, cache?: boolean }} [options]
 */
export function createStorage({
  namespace = '',
  storage = globalThis.localStorage,
  cache = true,
} = {}) {
  if (!storage) throw new TypeError('A Storage implementation is required');

  const prefix = namespace ? `${namespace}:` : '';
  const values = cache ? new Map() : null;
  const storageKey = key => `${prefix}${String(key)}`;

  function get(key) {
    const fullKey = storageKey(key);
    if (values?.has(fullKey)) return values.get(fullKey);
    const value = storage.getItem(fullKey);
    values?.set(fullKey, value);
    return value;
  }

  function set(key, value) {
    const fullKey = storageKey(key);
    const stringValue = String(value);
    storage.setItem(fullKey, stringValue);
    values?.set(fullKey, stringValue);
    return stringValue;
  }

  function has(key) {
    return get(key) !== null;
  }

  function remove(key) {
    const fullKey = storageKey(key);
    storage.removeItem(fullKey);
    values?.delete(fullKey);
  }

  function keys() {
    const result = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) result.push(key.slice(prefix.length));
    }
    return result;
  }

  function clear() {
    for (const key of keys()) storage.removeItem(storageKey(key));
    values?.clear();
  }

  return Object.freeze({ get, set, has, remove, keys, clear });
}
