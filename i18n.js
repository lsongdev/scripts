import { get, clone } from './obj.js';
import { format } from './string.js';

export const i18n = (obj) => {
  let locale, tree = obj || {};
  return {
    set(lang, table) {
      tree[lang] = Object.assign(tree[lang] || {}, table);
    },
    locale(lang) {
      return (locale = lang || locale);
    },
    table(){
      return tree[lang];
    },
    t(key, params, lang) {
      const val = get(tree[lang || locale], key);
      if (typeof val === 'function') return val(params);
      if (typeof val === 'string') return format(val, params);
      return val;
    }
  };
};
