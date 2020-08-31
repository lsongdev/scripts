import { addEventListener } from './dom.js';

export const pathToRegexp = path => {
  if (path instanceof RegExp) return path;
  let arr = path.split('/'), pattern = '', keys = [];
  (arr[0] === '') && arr.shift();
  arr.forEach((p, i) => {
    switch (p[0]) {
      case '*':
        pattern += '/(.+)';
        keys.push(p.substring(1) || `$${i}`);
        break;
      case ':':
        const o = p.substr(-1);
        const r = '([^/]+?)';
        const m = {
          '?': `(?:/${r})?`,
          '*': '(?:/)(.*)'
        };
        pattern += m[o] || `/${r}`;
        keys.push(p.substring(1, p.length - !!m[o]));
        break;
      default:
        pattern += `/${p}`;
        break;
    }
  });
  keys.length && (pattern += '(?:/)?');
  pattern = new RegExp(`^${pattern}\/?$`, 'i');
  pattern.keys = keys;
  pattern.path = path;
  pattern.parse = function (pathname) {
    if (this.test(pathname) === false) return null;
    return this.exec(pathname).slice(1).reduce((params, param, i) => {
      params[this.keys[i]] = param && decodeURIComponent(param);
      return params;
    }, {});
  };
  return pattern;
};

export const router = routes => {
  routes = Object.keys(routes).map(path => {
    const regexp = pathToRegexp(path);
    regexp.fn = routes[path];
    return regexp;
  });
  const hashchange = () => {
    const path = location.hash.slice(1);
    const route = routes.find(r => r.test(path));
    if(route) {
      const o = route.parse(path);
      route.fn.call(this, o);
    }
  };
  return () => {
    hashchange();
    return addEventListener(window, 'hashchange', hashchange)
  };
};