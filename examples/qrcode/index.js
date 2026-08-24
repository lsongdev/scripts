const scanner = document.querySelector('x-scanner');
document.querySelector('#startScanner').addEventListener('click', async () => {
  try {
    await scanner.start();
  } catch (error) {
    console.error(error);
  }
}, { once: true });
scanner.addEventListener('scan', (e) => {
  console.log('Scanned:', e.detail.value);
});
