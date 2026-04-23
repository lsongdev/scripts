const scanner = document.querySelector('x-scanner');
scanner.addEventListener('scan', (e) => {
  console.log('Scanned:', e.detail.value);
});