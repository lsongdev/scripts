import { useState, useRef, useCallback, useEffect } from '../react.js';

export * from './form.js';
export * from './http.js';

export function useThrottle(fn, delay) {
  const { current } = useRef({ fn, timer: null })
  return useCallback((...args) => {
    if (!current.timer) {
      current.timer = setTimeout(() => {
        current.timer = null
      }, delay)
      current.fn(...args)
    }
  }, []);
}

export function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(defaultValue);
  const storedValue = localStorage.getItem(key);
  useEffect(() => {
    setState(storedValue !== null ? JSON.parse(storedValue) : defaultValue);
  }, []);
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}
