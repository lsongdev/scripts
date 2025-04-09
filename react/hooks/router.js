import { pathToRegexp } from '../../router.js';
import { h, useState, useEffect } from '../react.js';

let _routes, _render, isHash = true;

export function useRouter(routes) {
  const [component, setComponent] = useState(null);

  _render = setComponent;
  _routes = Object.entries(routes).map(([path, component]) => {
    const regexp = pathToRegexp(path);
    return {
      path,
      regexp,
      component,
    };
  });

  useEffect(() => {
    process();
    window.addEventListener('popstate', process);
    return () => window.removeEventListener('popstate', process);
  }, []);
  return component;
}

const find = pathname => {
  for (const route of _routes) {
    const { regexp, component } = route;
    if (regexp.test(pathname)) {
      const props = regexp.parse(pathname);
      return h(component, props);
    }
  }
};

const process = () => {
  let path;
  const { hash, pathname } = location;
  path = isHash ? (hash.slice(1) || '/') : pathname;
  const component = find(path);
  _render(component);
};

export function push(url) {
  if (isHash) url = `#${url}`;
  window.history.pushState(null, null, url);
  process();
}

export const back = () => {
  history.back();
};
