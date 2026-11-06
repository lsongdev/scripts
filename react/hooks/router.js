import { createContext, useContext, useEffect, useState } from '../react.js';

/** Subscribe a Preact component to an explicitly managed router instance. */
export function useRoute(router) {
  const [route, setRoute] = useState(router.current);

  useEffect(() => {
    setRoute(router.current); // it may have moved between render and effect
    return router.subscribe(setRoute);
  }, [router]);
  return route;
}

/** The router that RouterView provides to the components below it. */
export const RouterContext = createContext(null);

/**
 * The router of the nearest RouterView, for links (`router.href`),
 * navigation and query updates in nested components.
 */
export function useRouter() {
  const router = useContext(RouterContext);
  if (!router) throw new Error('useRouter must be used below a RouterView');
  return router;
}
