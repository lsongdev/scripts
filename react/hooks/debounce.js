import { useEffect, useRef, useState } from '../react.js';

/** `value` once it has stopped changing for `wait` ms, as for search input. */
export function useDebouncedValue(value, wait = 250) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), wait);
    return () => clearTimeout(timer);
  }, [value, wait]);
  return settled;
}

/**
 * A stable function that calls the latest `fn` with the latest arguments
 * once calls have stopped for `wait` ms. A pending call is dropped on
 * unmount.
 */
export function useDebouncedCallback(fn, wait = 250) {
  const latest = useRef(fn);
  latest.current = fn;
  const debounced = useRef(null);
  if (!debounced.current) {
    let timer;
    const call = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => latest.current(...args), call.wait);
    };
    call.cancel = () => clearTimeout(timer);
    debounced.current = call;
  }
  debounced.current.wait = wait;
  useEffect(() => () => debounced.current.cancel(), []);
  return debounced.current;
}
