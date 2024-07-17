// https://developer.mozilla.org/en-US/docs/Web/API/notification

class AccessDeniedError extends Error {
  constructor() {
    super('Notification Access Denied');
  }
}

export const request = async () => {
  if (!('Notification' in window)) return;

  const { permission, requestPermission } = Notification;

  if (permission === 'default') {
    return requestPermission();
  }

  if (permission === 'denied') {
    throw new AccessDeniedError();
  }

  return permission;
};

export const showNotification = (title, options = {}) => {
  return new Notification(title, options);
};

export const notify = async (title, options) => {
  await request();
  return showNotification(title, options);
};
