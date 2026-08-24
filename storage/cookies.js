function token(value, name) {
  if (typeof value !== 'string' || !value || /[\u0000-\u0020()<>@,;:\\"/\[\]?={}\u007f]/.test(value)) {
    throw new TypeError(`${name} must be a valid cookie token`);
  }
  return value;
}

/** Parse a Cookie header/document.cookie value without hidden decoding. */
export function parseCookies(source) {
  if (typeof source !== 'string') throw new TypeError('Cookie source must be a string');
  const cookies = new Map();
  for (const segment of source.split(';')) {
    const separator = segment.indexOf('=');
    if (separator === -1) continue;
    const name = segment.slice(0, separator).trim();
    if (!name) continue;
    cookies.set(name, segment.slice(separator + 1).trim());
  }
  return cookies;
}

/** Serialize one browser-settable cookie assignment. */
export function serializeCookie(name, value, {
  domain,
  expires,
  maxAge,
  partitioned = false,
  path,
  sameSite,
  secure = false,
} = {}) {
  token(name, 'name');
  const encoded = encodeURIComponent(String(value));
  const parts = [`${name}=${encoded}`];
  if (domain !== undefined) parts.push(`Domain=${domain}`);
  if (path !== undefined) parts.push(`Path=${path}`);
  if (expires !== undefined) parts.push(`Expires=${new Date(expires).toUTCString()}`);
  if (maxAge !== undefined) {
    if (!Number.isInteger(maxAge)) throw new TypeError('maxAge must be an integer');
    parts.push(`Max-Age=${maxAge}`);
  }
  if (sameSite !== undefined) {
    const normalized = String(sameSite).toLowerCase();
    const values = { lax: 'Lax', none: 'None', strict: 'Strict' };
    if (!values[normalized]) throw new TypeError('sameSite must be Lax, Strict, or None');
    parts.push(`SameSite=${values[normalized]}`);
  }
  if (secure) parts.push('Secure');
  if (partitioned) parts.push('Partitioned');
  return parts.join('; ');
}

/** Set a cookie through the supplied Document and return its assignment text. */
export function setCookie(name, value, options, {
  document: target = globalThis.document,
} = {}) {
  if (!target) throw new ReferenceError('Document is required');
  const assignment = serializeCookie(name, value, options);
  target.cookie = assignment;
  return assignment;
}

/** Expire a cookie using the same path/domain scope used when it was created. */
export function deleteCookie(name, options, dependencies) {
  return setCookie(name, '', { ...options, expires: new Date(0), maxAge: 0 }, dependencies);
}
