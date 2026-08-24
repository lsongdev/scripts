import assert from 'node:assert/strict';
import test from 'node:test';

import {
  notify,
  requestNotificationPermission,
} from '../notifications.js';

class GrantedNotification {
  static permission = 'default';

  static async requestPermission() {
    this.permission = 'granted';
    return this.permission;
  }

  constructor(title, options) {
    this.title = title;
    this.options = options;
  }
}

test('notification permission resolves only when granted', async () => {
  GrantedNotification.permission = 'default';
  assert.equal(await requestNotificationPermission({
    Notification: GrantedNotification,
  }), 'granted');
});

test('notification permission rejects denied access explicitly', async () => {
  class DeniedNotification {
    static permission = 'denied';
  }
  await assert.rejects(
    requestNotificationPermission({ Notification: DeniedNotification }),
    error => error.name === 'NotAllowedError',
  );
});

test('notify returns the standard Notification instance', async () => {
  GrantedNotification.permission = 'granted';
  const notification = await notify('Hello', { body: 'World' }, {
    Notification: GrantedNotification,
  });
  assert.ok(notification instanceof GrantedNotification);
  assert.equal(notification.title, 'Hello');
  assert.deepEqual(notification.options, { body: 'World' });
});
