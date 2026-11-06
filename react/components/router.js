import { h, useEffect, useState } from '../react.js';
import { RouterContext, useRoute } from '../hooks/router.js';
import { Loading } from './feedback.js';
import { Alert } from './alert.js';

/**
 * A page component that loads its module on first render, for routes that
 * should not all load up front: pass a function that imports the page's
 * module, such as `() => import(url)`.
 * The module's default export is rendered with the same props. While it
 * loads, `loading` shows (a Loading message by default); a failed import
 * shows its error.
 */
export function lazy(load, { loading = h(Loading) } = {}) {
  let module = null;
  let pending = null;
  return function Lazy(props) {
    const [, loaded] = useState(0);
    const [error, setError] = useState(null);
    useEffect(() => {
      if (module) return;
      pending ??= load().then(m => { module = m; });
      pending.then(() => loaded(n => n + 1), err => { pending = null; setError(err); });
    }, []);
    if (error) return h(Alert, { error });
    return module ? h(module.default, props) : loading;
  };
}

/**
 * Renders the component that the current route of a started router
 * (navigation/router.js) maps to, with `{ params, query, route }` as props.
 * Moving to another path mounts the page afresh; a new query re-renders it.
 * Descendants reach the router with useRouter(). `notFound` shows when no
 * route matches.
 */
export function RouterView({ router, notFound = h(Alert, { variant: 'warning' }, 'Page not found') }) {
  const route = useRoute(router);
  const Page = route?.value;
  return h(RouterContext.Provider, { value: router },
    !route ? null
      : typeof Page === 'function'
        ? h(Page, { key: route.path, params: route.params, query: route.query, route })
        : notFound);
}
