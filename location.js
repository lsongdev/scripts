
export const requestLocation = options => new Promise((resolve, reject) => {
  if (!navigator.geolocation) reject();
  return navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

export const distance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const c = Math.cos;
  const p = Math.PI / 180;
  const deg2rad = deg => deg * p;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a = 0.5 - c(dLat) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c(dLon)) / 2;
  return (2 * R) * Math.asin(Math.sqrt(a));
};
