function validate({ characters, fontSize, random }) {
  if (!Number.isFinite(fontSize) || fontSize <= 0) throw new RangeError('fontSize must be finite and positive');
  if (typeof random !== 'function') throw new TypeError('random must be a function');
  if (!characters.length) throw new TypeError('characters must not be empty');
}

/** Cancellable Matrix-rain canvas recipe. Canvas sizing remains caller-owned. */
export function createMatrixRain(canvas, {
  characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', color = '#4fc08d',
  fade = 'rgba(0, 0, 0, 0.05)', fontFamily = 'monospace', fontSize = 16,
  random = Math.random, resetProbability = 0.05, signal,
  requestFrame = globalThis.requestAnimationFrame,
  cancelFrame = globalThis.cancelAnimationFrame,
} = {}) {
  validate({ characters, fontSize, random });
  signal?.throwIfAborted();
  const context = canvas.getContext('2d');
  if (!context) throw new ReferenceError('CanvasRenderingContext2D is required');
  let drops = [];
  let frame;
  let running = false;
  const synchronize = () => {
    const count = Math.ceil(canvas.width / fontSize);
    if (drops.length !== count) drops = Array.from({ length: count }, (_, index) => drops[index] ?? 1);
  };
  const draw = () => {
    synchronize();
    context.save();
    try {
      context.fillStyle = fade;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = color;
      context.font = `${fontSize}px ${fontFamily}`;
      drops.forEach((drop, index) => {
        const character = characters[Math.floor(random() * characters.length)];
        context.fillText(character, index * fontSize, drop * fontSize);
        drops[index] = drop * fontSize > canvas.height && random() < resetProbability ? 0 : drop + 1;
      });
    } finally { context.restore(); }
  };
  const tick = () => { if (running) { draw(); if (running) frame = requestFrame(tick); } };
  const stop = () => {
    if (!running) return;
    running = false;
    if (frame !== undefined) cancelFrame(frame);
    frame = undefined;
    signal?.removeEventListener('abort', stop);
  };
  const start = () => {
    signal?.throwIfAborted();
    if (running) return;
    running = true;
    signal?.addEventListener('abort', stop, { once: true });
    frame = requestFrame(tick);
  };
  return Object.freeze({ canvas, context, draw, start, stop, get running() { return running; } });
}
