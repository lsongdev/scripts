function entryText(value) {
  return typeof File !== 'undefined' && value instanceof File ? value.name : value;
}

function appendEntries(parameters, formData) {
  for (const [name, value] of formData) parameters.append(name, entryText(value));
  return parameters;
}

/** Build the standard Request represented by a form and optional submitter. */
export function formToRequest(form, {
  submitter,
  headers,
  signal,
} = {}) {
  if (!form || typeof form.action !== 'string') throw new TypeError('form must be an HTMLFormElement');
  signal?.throwIfAborted();
  const data = new FormData(form, submitter);
  const method = (form.method || 'get').toUpperCase();
  const url = new URL(form.action, form.ownerDocument?.baseURI);
  const init = { method, headers: new Headers(headers), signal };

  if (method === 'GET' || method === 'HEAD') {
    appendEntries(url.searchParams, data);
  } else if (form.enctype === 'application/x-www-form-urlencoded') {
    init.body = appendEntries(new URLSearchParams(), data);
    if (!init.headers.has('content-type')) {
      init.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
    }
  } else if (form.enctype === 'text/plain') {
    const text = [...data].map(([name, value]) => `${name}=${entryText(value)}\r\n`).join('');
    init.body = new Blob([text], { type: 'text/plain' });
  } else {
    init.body = data;
  }
  return new Request(url, init);
}

/** Submit through injected/native fetch and return its unmodified Response. */
export function submitForm(form, options = {}, {
  fetch: fetchImplementation = globalThis.fetch,
} = {}) {
  if (typeof fetchImplementation !== 'function') throw new ReferenceError('fetch is required');
  return fetchImplementation(formToRequest(form, options));
}

/** Bind an explicit submit workflow and return an idempotent disposer. */
export function bindFormSubmission(form, handler, { signal } = {}) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  signal?.throwIfAborted();
  const submit = event => {
    event.preventDefault();
    return handler(formToRequest(form, { submitter: event.submitter, signal }), event);
  };
  form.addEventListener('submit', submit);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    form.removeEventListener('submit', submit);
    signal?.removeEventListener('abort', dispose);
  };
  signal?.addEventListener('abort', dispose, { once: true });
  return dispose;
}
