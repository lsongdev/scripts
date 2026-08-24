export function linkToRequest(link, {
  body,
  headers,
  method = 'GET',
  signal,
} = {}) {
  if (!link || typeof link.href !== 'string') throw new TypeError('link must be an HTMLAnchorElement');
  signal?.throwIfAborted();
  const normalizedMethod = String(method).toUpperCase();
  if ((normalizedMethod === 'GET' || normalizedMethod === 'HEAD') && body !== undefined) {
    throw new TypeError(`${normalizedMethod} requests cannot contain a body`);
  }
  return new Request(link.href, { body, headers, method: normalizedMethod, signal });
}

/** Turn ordinary unmodified activation into an explicit Request handler. */
export function bindLinkAction(link, handler, options = {}) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  const { signal } = options;
  signal?.throwIfAborted();
  const activate = event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
      || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    event.preventDefault();
    return handler(linkToRequest(link, options), event);
  };
  link.addEventListener('click', activate);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    link.removeEventListener('click', activate);
    signal?.removeEventListener('abort', dispose);
  };
  signal?.addEventListener('abort', dispose, { once: true });
  return dispose;
}
