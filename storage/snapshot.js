export const STORAGE_SNAPSHOT_VERSION = 1;

function storageLike(storage) {
  if (!storage || typeof storage.length !== 'number'
    || typeof storage.key !== 'function'
    || typeof storage.setItem !== 'function') {
    throw new TypeError('storage must implement the Storage interface');
  }
  return storage;
}

function validateSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== STORAGE_SNAPSHOT_VERSION
    || !Array.isArray(snapshot.entries)) {
    throw new TypeError('Invalid storage snapshot');
  }
  const entries = snapshot.entries.map(entry => {
    if (!Array.isArray(entry) || entry.length !== 2
      || typeof entry[0] !== 'string' || typeof entry[1] !== 'string') {
      throw new TypeError('Storage snapshot entries must be string pairs');
    }
    return Object.freeze([entry[0], entry[1]]);
  });
  return Object.freeze({ version: STORAGE_SNAPSHOT_VERSION, entries: Object.freeze(entries) });
}

/** Capture the exact string key/value state of a Storage implementation. */
export function createStorageSnapshot(storage = globalThis.localStorage) {
  const source = storageLike(storage);
  const entries = [];
  for (let index = 0; index < source.length; index += 1) {
    const key = source.key(index);
    if (key !== null) entries.push(Object.freeze([key, source.getItem(key)]));
  }
  return Object.freeze({ version: STORAGE_SNAPSHOT_VERSION, entries: Object.freeze(entries) });
}

export function stringifyStorageSnapshot(snapshot, space) {
  return JSON.stringify(validateSnapshot(snapshot), null, space);
}

export function parseStorageSnapshot(text) {
  if (typeof text !== 'string') throw new TypeError('snapshot text must be a string');
  return validateSnapshot(JSON.parse(text));
}

/** Restore a validated snapshot. Existing values are preserved unless replace is true. */
export function restoreStorageSnapshot(snapshot, {
  storage = globalThis.localStorage,
  replace = false,
} = {}) {
  const target = storageLike(storage);
  const validated = validateSnapshot(snapshot);
  if (replace) target.clear();
  for (const [key, value] of validated.entries) target.setItem(key, value);
  return validated.entries.length;
}
