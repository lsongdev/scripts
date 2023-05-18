export const readFileAsText = (file, encoding = 'UTF-8') => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Error reading file as text'));
  reader.onload = () => resolve(reader.result);
  reader.readAsText(file, encoding);
});

export async function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error reading file as array buffer'));
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
}

export async function readAsBinaryString(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error reading file as binary string'));
    reader.onload = () => resolve(reader.result);
    reader.readAsBinaryString(file);
  });
}
