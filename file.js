
export const readFileAsText = (file, encoding) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.addEventListener('error', reject);
  reader.addEventListener('load', () => resolve(reader.result));
  return reader.readAsText(file, encoding);
});
