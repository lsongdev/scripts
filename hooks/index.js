import { useRef, useCallback } from '../react/index.js';

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
