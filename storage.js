
const storage = ({ name, store = localStorage, cache = new Map } = {}) => {
  const prefix = name ? + `${name}:` : '';
  const ctx = {
    setSync(key, value) {
      key = prefix + key;
      store.setItem(key, value);
      cache && cache.set(key, value);
      return { key, value };
    },
    set(key, value) {
      return new Promise((resolve, reject) => {
        try {
          resolve(ctx.setSync(key, value));
        } catch (e) {
          reject(e);
        }
      })
    },
    getSync(key) {
      key = prefix + key;
      if (cache && cache.has(key))
        return cache.get(key);
      const value = store.getItem(key);
      cache && cache.set(key, value);
      return value;
    },
    get(key) {
      return new Promise((resolve, reject) => {
        try {
          resolve(ctx.getSync(key));
        } catch (e) {
          reject(e);
        }
      });
    },
    clear: () => new Promise((resolve, reject) => {
      try {
        store.clear();
        resolve();
      } catch (e) {
        reject(e);
      }
    }),
  };
  return ctx;
};

const { get, getSync, set, setSync, clear } = storage();

export { get, getSync, set, setSync, clear };
export default storage;
