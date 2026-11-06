import { useCallback, useEffect, useRef, useState } from '../react.js';

/**
 * Load data with `load(signal)` and keep it in state: `{ data, error,
 * loading, reload }`. Loading again when `deps` change or reload() is called
 * keeps the previous data on screen instead of clearing it. The previous
 * load's signal is aborted when a new one starts and on unmount, and its
 * result is ignored.
 *
 * `interval` (ms, or a function of the latest data returning ms) loads again
 * that long after each load finishes, while it is positive.
 */
export function useResource(load, deps = [], { interval } = {}) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const [version, setVersion] = useState(0);
  const latest = useRef({ load, interval });
  latest.current = { load, interval };

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    const run = async () => {
      setState(s => (s.loading ? s : { ...s, loading: true }));
      let data;
      try {
        data = await latest.current.load(controller.signal);
        if (controller.signal.aborted) return;
        setState({ data, error: null, loading: false });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState(s => ({ ...s, error, loading: false }));
      }
      const every = latest.current.interval;
      const delay = typeof every === 'function' ? every(data) : every;
      if (delay > 0) timer = setTimeout(run, delay);
    };
    run();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [...deps, version]);

  const reload = useCallback(() => setVersion(v => v + 1), []);
  return { ...state, reload };
}

/**
 * Run one asynchronous action at a time, for a form or a button whose
 * failure shows next to it: `{ busy, error, run, setError }`. run(fn)
 * resolves to fn's result, or undefined when fn throws (the error is kept)
 * or when an earlier run is still going, so double submits do nothing.
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const pending = useRef(false);
  const run = useCallback(async fn => {
    if (pending.current) return undefined;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err);
      return undefined;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, error, run, setError };
}
