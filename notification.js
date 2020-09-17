// https://developer.mozilla.org/en-US/docs/Web/API/notification

class AccessDeiedError extends Error { }

export const request = () => Promise
  .resolve(Notification)
  .then(({ permission, requestPermission }) => {
    switch (permission) {
      case 'default':
        return requestPermission().then(request);
      case 'granted':
        return permission;
      case 'denied':
        throw new AccessDeiedError();
    }
  });

export const notify = async (title, options) => {
  const permission = await request();
  const notification = new Notification(title, options);
  return notification;
};
