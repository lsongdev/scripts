import { randomId } from '../math.js';

export const createStyle = (content, className = 'stylesheet-' + randomId(6)) => {
  if (typeof content !== 'string')
    content = Object.entries(content).map(([key, value]) => `${key}: ${value}`).join('; ');
  const dom = document.createElement('style');
  dom.textContent = `.${className} {${content}}`;
  return { dom, className };
};


/**
 * @param {*} content 
 * @param {*} className 
 * @returns 
 */
export const style = content => {
  const style = createStyle(content);
  document.head.appendChild(style.dom);
  return style.className;
};


export function cls() {
  return []
    .slice
    .call(arguments)
    .map(function (c) {
      switch (/\[object (\w+)\]/.exec(({}).toString.call(c))[1]) {
        case 'Array': return c;
        case 'String': return [c];
        case 'Object': return Object.keys(c).filter(function (k) {
          return c[k];
        });
      }
      return [];
    })
    .reduce(function (p, c) {
      return p.concat(c)
    }, [])
    .filter(Boolean)
    .reduce(function (p, c) {
      if (p.indexOf(c) < 0) p.push(c);
      return p;
    }, []).join(' ');
};
