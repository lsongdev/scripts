/**
 * Create an inert History API router backed by the standard URLPattern API.
 * Construction does not register listeners; call `start()` explicitly.
 *
 * Routes may be an object, Map, or `[pattern, value][]`. The associated value
 * is returned in route contexts but is never invoked by the router.
 */
export function createRouter(routes = {}, {
  window: target = globalThis.window,
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

  function resolve(input = target.location.href) {
    const url = input instanceof URL ? input : new URL(input, target.location.href);

    for (const route of patterns) {
      const match = route.pattern.exec(url);
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
    const match = resolve();
    current = Object.freeze({
      ...match,
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

  function navigate(to, { replace = false, state = null } = {}) {
    const url = new URL(to, target.location.href);
    const method = replace ? 'replaceState' : 'pushState';
    target.history[method](state, '', url);
    return dispatch();
  }

  return Object.freeze({
    back: () => target.history.back(),
    get current() {
      return current;
    },
    navigate,
    resolve,
    start,
    stop,
    subscribe,
  });
}

export const back = () =>
  history.back();

