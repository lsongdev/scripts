
export const registerServiceWorker = async (entry = 'sw.js', scope = '/') => {
  if (!("serviceWorker" in navigator)) return
  console.debug("registerServiceWorker");
  const registration = await navigator.serviceWorker.register(entry, { scope });
  if (registration.installing) {
    console.debug("Service worker installing");
  } else if (registration.waiting) {
    console.debug("Service worker installed");
  } else if (registration.active) {
    console.debug("Service worker active");
  }
  return registration;
};
