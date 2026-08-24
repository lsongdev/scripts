import { useEffect, useState } from '../react.js';

/** Subscribe a Preact component to an explicitly managed router instance. */
export function useRoute(router) {
  const [route, setRoute] = useState(router.current);

  useEffect(() => router.subscribe(setRoute), [router]);
  return route;
}
