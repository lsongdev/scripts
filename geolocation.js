
export const getCurrentPosition = options => new Promise((resolve, reject) => {
  if (!navigator.geolocation) reject();
  return navigator.geolocation.getCurrentPosition(resolve, reject, options);
});
