/** Cancellable pointer-aware particle-network canvas recipe. */
export function createParticleNetwork(canvas, {
  count = 80, maxDistance = 100, pointerTarget = canvas, random = Math.random, signal,
  requestFrame = globalThis.requestAnimationFrame,
  cancelFrame = globalThis.cancelAnimationFrame,
} = {}) {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('count must be a non-negative integer');
  if (!Number.isFinite(maxDistance) || maxDistance <= 0) throw new RangeError('maxDistance must be positive');
  if (typeof random !== 'function') throw new TypeError('random must be a function');
  signal?.throwIfAborted();
  const context = canvas.getContext('2d');
  if (!context) throw new ReferenceError('CanvasRenderingContext2D is required');
  const particles = Array.from({ length: count }, () => ({
    x: random() * canvas.width, y: random() * canvas.height,
    vx: random() * 2 - 1, vy: random() * 2 - 1,
  }));
  const pointer = { x: undefined, y: undefined };
  let frame;
  let running = false;
  const move = event => {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    pointer.y = (event.clientY - bounds.top) * canvas.height / bounds.height;
  };
  const leave = () => { pointer.x = undefined; pointer.y = undefined; };
  const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const points = pointer.x === undefined ? particles : [...particles, pointer];
    for (let first = 0; first < particles.length; first += 1) {
      const particle = particles[first];
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
      context.fillRect(particle.x, particle.y, 1, 1);
      for (let second = first + 1; second < points.length; second += 1) {
        const other = points[second];
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance > maxDistance) continue;
        context.save();
        context.globalAlpha = 1 - distance / maxDistance;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(other.x, other.y);
        context.stroke();
        context.restore();
      }
    }
  };
  const tick = () => { if (running) { draw(); if (running) frame = requestFrame(tick); } };
  const stop = () => {
    if (!running) return;
    running = false;
    if (frame !== undefined) cancelFrame(frame);
    pointerTarget.removeEventListener('pointermove', move);
    pointerTarget.removeEventListener('pointerleave', leave);
    signal?.removeEventListener('abort', stop);
    frame = undefined;
    leave();
  };
  const start = () => {
    signal?.throwIfAborted();
    if (running) return;
    running = true;
    pointerTarget.addEventListener('pointermove', move);
    pointerTarget.addEventListener('pointerleave', leave);
    signal?.addEventListener('abort', stop, { once: true });
    frame = requestFrame(tick);
  };
  return Object.freeze({ canvas, context, particles, draw, start, stop, get running() { return running; } });
}
