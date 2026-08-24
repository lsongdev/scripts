function notificationAPI(target) {
  if (!target) throw new ReferenceError('Notification is required');
  return target;
}

/** Request notification permission and resolve only when it is granted. */
export async function requestNotificationPermission({
  Notification: target = globalThis.Notification,
} = {}) {
  const API = notificationAPI(target);
  const permission = API.permission === 'default'
    ? await API.requestPermission()
    : API.permission;
  if (permission !== 'granted') {
    throw new DOMException('Notification permission was not granted', 'NotAllowedError');
  }
  return permission;
}

/** Request permission if needed and return a standard Notification instance. */
export async function notify(title, options, {
  Notification: target = globalThis.Notification,
} = {}) {
  const API = notificationAPI(target);
  await requestNotificationPermission({ Notification: API });
  return new API(title, options);
}
