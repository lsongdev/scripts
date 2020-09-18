
export const accelerometer = (options = { frequency: 60 }, cb) => {
  const acl = new Accelerometer(options);
  acl.addEventListener('reading', () => cb(acl));
  return acl;
};
