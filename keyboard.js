
export const onKeydown = (key, fn) => {
  return document.addEventListener('keydown', (e) => {
    if (e.key === key) fn();
  });
};
