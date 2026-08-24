import { getPath } from '../array/records.js';

/** Interpolate plain-text `{name}` placeholders without evaluating source text. */
export function formatMessage(template, parameters = {}, { missing = 'keep' } = {}) {
  if (typeof template !== 'string') throw new TypeError('template must be a string');
  if (missing !== 'keep' && missing !== 'throw') {
    throw new TypeError("missing must be 'keep' or 'throw'");
  }
  return template.replace(/\{([\w.-]+)\}/gu, (placeholder, key) => {
    const value = getPath(parameters, key, undefined);
    if (value === undefined) {
      if (missing === 'throw') throw new ReferenceError(`Missing message parameter: ${key}`);
      return placeholder;
    }
    return String(value);
  });
}

/** Create an isolated message catalog with explicit locale and fallback policy. */
export function createMessages(initial = {}, {
  locale,
  fallbackLocale,
} = {}) {
  const tables = new Map(Object.entries(initial));
  let currentLocale = locale;

  return Object.freeze({
    get locale() { return currentLocale; },
    setLocale(nextLocale) {
      if (typeof nextLocale !== 'string' || !nextLocale) {
        throw new TypeError('locale must be a non-empty string');
      }
      currentLocale = nextLocale;
      return currentLocale;
    },
    set(nextLocale, table) {
      if (typeof nextLocale !== 'string' || !nextLocale || !table || typeof table !== 'object') {
        throw new TypeError('locale and message table are required');
      }
      tables.set(nextLocale, table);
    },
    translate(key, parameters, {
      locale: requestedLocale = currentLocale,
      missing = 'keep',
    } = {}) {
      if (!requestedLocale) throw new ReferenceError('No message locale selected');
      let message = getPath(tables.get(requestedLocale), key, undefined);
      if (message === undefined && fallbackLocale) {
        message = getPath(tables.get(fallbackLocale), key, undefined);
      }
      if (message === undefined) return undefined;
      if (typeof message === 'function') return message(parameters, requestedLocale);
      return formatMessage(message, parameters, { missing });
    },
  });
}
