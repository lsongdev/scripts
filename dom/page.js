import { ready, visibilityChange } from '../dom.js';

export const page = (app) => {
  const {
    onLoad, unLoad,
    onShow, onHide,
  } = app;
  // init
  ready(onLoad);
  // page events
  visibilityChange((hidden, e) => {
    const fn = (hidden ? onHide : onShow);
    typeof fn === 'function' && fn.call(app, e);
  });

};
