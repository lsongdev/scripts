import { update, isFn, getCurrentFiber } from "./reconcile.js";

const EMPTY_ARR = [];
let cursor = 0;

export const resetCursor = () => cursor = 0;
export const useCallback = (cb, deps) => useMemo(() => cb, deps);
export const useRef = (current) => useMemo(() => ({ current }), []);
export const useState = initState => useReducer(null, initState);
export const useEffect = (cb, deps) => effectImpl(cb, deps, "effect");
export const useLayout = (cb, deps) => effectImpl(cb, deps, "layout");
export const useReducer = (reducer, initState) => {
  const [hook, current] = getHook(cursor++);
  if (hook.length === 0) {
    hook[0] = initState;
    hook[1] = (value) => {
      hook[0] = reducer
        ? reducer(hook[0], value)
        : isFn(value)
          ? value(hook[0])
          : value;
      update(current);
    };
  }
  return hook;
};

const effectImpl = (cb, deps, key) => {
  const [hook, current] = getHook(cursor++);
  if (isChanged(hook[1], deps)) {
    hook[0] = cb;
    hook[1] = deps;
    current.hooks[key].push(hook);
  }
};

export const useMemo = (cb, deps) => {
  const hook = getHook(cursor++)[0];
  if (isChanged(hook[1], deps)) {
    hook[1] = deps;
    return (hook[0] = cb());
  }
  return hook[0];
};

export const getHook = (cursor) => {
  const current = getCurrentFiber();
  const hooks = current.hooks || (current.hooks = { list: [], effect: [], layout: [] });
  if (cursor >= hooks.list.length) {
    hooks.list.push([]);
  }
  return [hooks.list[cursor], current];
};

export const createContext = (initialValue) => {
  const contextComponent = ({ value, children }) => {
    const valueRef = useRef(value);
    const subscribers = useMemo(() => new Set(), EMPTY_ARR);
    if (valueRef.current !== value) {
      valueRef.current = value;
      subscribers.forEach((subscriber) => subscriber());
    }
    return children;
  };
  contextComponent.initialValue = initialValue;
  return contextComponent;
};

export const useContext = (contextType) => {
  let subscribersSet;
  const triggerUpdate = useReducer(null, null)[1];
  useEffect(() => {
    return () => subscribersSet && subscribersSet.delete(triggerUpdate);
  }, EMPTY_ARR);
  let contextFiber = getCurrentFiber().parent;
  while (contextFiber && contextFiber.type !== contextType) {
    contextFiber = contextFiber.parent;
  }
  if (contextFiber) {
    const hooks = contextFiber.hooks.list;
    const [[value], [subscribers]] = hooks;
    subscribersSet = subscribers.add(triggerUpdate);
    return value.current;
  }
  else {
    return contextType.initialValue;
  }
};

export const isChanged = (a, b) => {
  return !a || a.length !== b.length || b.some((arg, index) => !Object.is(arg, a[index]));
};
