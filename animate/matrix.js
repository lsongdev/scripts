

export const createMatrix = ({ canvas, fontSize = 16, fontColor = '#4FC08D' }) => {
  const ctx = canvas.getContext('2d');
  const texts = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const columns = canvas.width / fontSize;
  const drops = [];
  for (var x = 0; x < columns; x++) {
    drops[x] = 1;
  }
  const clear = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  let running = true;
  function draw() {
    clear();
    ctx.fillStyle = fontColor;
    ctx.font = `${fontSize}px arial`;
    for (let i = 0; i < drops.length; i++) {
      const text = texts[Math.floor(Math.random() * texts.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height || Math.random() > 0.95) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  return {
    start() {
      running = true;
      (function loop() {
        draw();
        if (running) requestAnimationFrame(loop);
      })();
    },
    stop() {
      running = false;
    }
  };
};