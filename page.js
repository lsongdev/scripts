import { ready, visibilityChange } from './dom.js';

export const page = (app) => {
  const {
    onLoad, unLoad,
    onShow, onHide,
  } = app;
  // init
  ready(
    () => typeof onLoad === 'function' && onLoad.apply(app),
    () => typeof unLoad === 'function' && unLoad.apply(app),
  );
  // page events
  visibilityChange((hidden, e) => {
    const fn = (hidden ? onHide : onShow);
    typeof fn === 'function' && fn.call(app, e);
  });

};