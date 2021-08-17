// https://developer.mozilla.org/en-US/docs/Web/API/notification

class AccessDeniedError extends Error {
  constructor() {
    super(`Notification Access Denied`);
  }
}

export const request = async () => {
  if (!('Notification' in window)) return;
  const { permission, requestPermission } = window.Notification;
  switch (permission) {
    case 'default':
      return requestPermission();
    case 'granted':
      return permission;
    case 'denied':
      throw new AccessDeniedError();
  }
};

export const showNotification = async (title, options) => {
  return new Notification(title, options);
};

export const notify = async (title, options) => {
  await request();
  return showNotification(title, options);
};
