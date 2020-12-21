import { addEventListener } from './dom.js';

const parsePath = path => {
  const partialPath = {};
  let hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    partialPath.hash = path.substr(hashIndex);
    path = path.substr(0, hashIndex);
  }
  let searchIndex = path.indexOf('?');
  if (searchIndex >= 0) {
    partialPath.search = path.substr(searchIndex);
    path = path.substr(0, searchIndex);
  }
  if (path) {
    partialPath.pathname = path;
  }
  return partialPath;
};

const getLocation = () => {
  const { pathname, search, hash } = window.location;
  return {
    pathname,
    search,
    hash,
    state: null,
  };
};

const getNexLocation = (path, state) => {
  return {
    ...parsePath(path),
    state,
  };
};

let location = getLocation();

const listeners = [];
export const listen = fn => {
  listeners.push(fn);
  return () =>
    listeners = listeners.filter(listener => listener !== fn);
};

export const push = (to, state) => {
  location = getNexLocation(to, state);
  window.history.pushState(state, '', to);
  listeners.forEach(fn => fn(location));
};

export const back = () =>
  history.back();

addEventListener(window, 'popstate', e => {
  location = getLocation();
  location.state = e.state;
  listeners.forEach(fn => fn(location));
});

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
