import { on, ready } from '../../dom/events.js';
import { $ } from '../../dom/query.js';
import { notify, requestNotificationPermission } from '../../browser/notifications.js';

ready(() => {
  on($('#request'), 'click', () => {
    requestNotificationPermission();
  });
  on($('#notify'), 'click', () => {
    notify('Hi');
  });
});
