import { ready, addEventListener } from '../../dom.js';
import { request, notify } from '../../notification.js';

ready(() => {
  addEventListener('#request', 'click', () => {
    request();
  });
  addEventListener('#notify', 'click', () => {
    notify('Hi');
  });
});
