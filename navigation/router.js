/**
 * Create an inert History API router backed by the standard URLPattern API.
 * Construction does not register listeners; call `start()` explicitly.
 *
 * Routes may be an object, Map, or `[pattern, value][]`. The associated value
 * is returned in route contexts but is never invoked by the router.
 *
 * With `hash`, routes live in the fragment ("#/users/42?tab=keys"), so a page
 * served from one static file needs no server-side fallback; same-document
 * "#/…" links then route without any click handling.
 *
 * Route contexts carry `path` and `query` (an object of the query string) of
 * the routed URL, besides the URLPattern `params`.
 */
export function createRouter(routes = {}, {
  window: target = globalThis.window,
  hash = false,
} = {}) {
  if (!target) throw new TypeError('A Window implementation is required');
  if (typeof URLPattern !== 'function') {
    throw new ReferenceError('URLPattern is required');
  }

  const entries = routes instanceof Map
    ? [...routes]
    : Array.isArray(routes)
      ? routes
      : Object.entries(routes);

  const patterns = entries.map(([pattern, value]) => ({
    pattern: pattern instanceof URLPattern
      ? pattern
      : new URLPattern({
        baseURL: target.location.href,
        pathname: pattern,
      }),
    value,
  }));

  const listeners = new Set();
  let lifecycle;
  let routeLifecycle;
  let current = null;

  // routed returns the URL whose path and query route: the page URL, or with
  // hash the fragment read as a path on the same origin.
  function routed(url) {
    if (!hash) return url;
    return new URL(url.hash.replace(/^#/, '') || '/', url.origin);
  }

  function resolve(input = target.location.href) {
    const url = input instanceof URL ? input : new URL(input, target.location.href);
    const at = routed(url);

    for (const route of patterns) {
      const match = route.pattern.exec(at);
      if (!match) continue;
      return {
        params: Object.freeze({ ...match.pathname.groups }),
        pattern: route.pattern,
        url,
        value: route.value,
      };
    }
    return null;
  }

  function dispatch() {
    routeLifecycle?.abort(new DOMException('Route changed', 'AbortError'));
    routeLifecycle = new AbortController();
    const url = new URL(target.location.href);
    const at = routed(url);
    const match = resolve(url);
    current = Object.freeze({
      params: Object.freeze({}),
      url,
      ...match,
      path: at.pathname,
      query: Object.freeze(Object.fromEntries(at.searchParams)),
      signal: routeLifecycle.signal,
      state: target.history.state,
    });
    for (const listener of listeners) listener(current);
    return current;
  }

  function subscribe(listener, { signal } = {}) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    signal?.throwIfAborted();
    listeners.add(listener);
    const remove = () => {
      listeners.delete(listener);
      signal?.removeEventListener('abort', remove);
    };
    signal?.addEventListener('abort', remove, { once: true });
    return remove;
  }

  function start() {
    if (lifecycle) return stop;
    lifecycle = new AbortController();
    target.addEventListener('popstate', dispatch, {
      signal: lifecycle.signal,
    });
    // Fragment links and a typed fragment change the hash without popstate in
    // some browsers; a change that also fired popstate resolves to the same
    // route and is simply dispatched again.
    if (hash) {
      target.addEventListener('hashchange', dispatch, {
        signal: lifecycle.signal,
      });
    }
    dispatch();
    return stop;
  }

  function stop() {
    lifecycle?.abort();
    lifecycle = undefined;
    routeLifecycle?.abort(new DOMException('Router stopped', 'AbortError'));
    routeLifecycle = undefined;
    current = null;
  }

  /** Go to a path (with an optional query string) and dispatch the route. */
  function navigate(to, { replace = false, state = null } = {}) {
    const url = hash
      ? new URL('#' + to, target.location.href)
      : new URL(to, target.location.href);
    const method = replace ? 'replaceState' : 'pushState';
    target.history[method](state, '', url);
    return dispatch();
  }

  /**
   * The link to a path with query values, for href attributes. Values that are
   * undefined, null or "" are left out.
   */
  function href(path, query) {
    const search = new URLSearchParams(Object.entries(query || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();
    return (hash ? '#' : '') + path + (search ? '?' + search : '');
  }

  /**
   * Change some query values of the current route, without a new history
   * entry unless `replace` is false; "" or null removes a value. Filters kept
   * this way survive reloads and can be shared as links.
   */
  function setQuery(patch, { replace = true } = {}) {
    const route = current || dispatch();
    const next = href(route.path, { ...route.query, ...patch });
    return navigate(hash ? next.slice(1) : next, { replace });
  }

  return Object.freeze({
    back: () => target.history.back(),
    get current() {
      return current;
    },
    href,
    navigate,
    resolve,
    setQuery,
    start,
    stop,
    subscribe,
  });
}

export const back = () =>
  history.back();

