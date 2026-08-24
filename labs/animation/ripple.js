/** Bind a native Web Animations ripple recipe and return complete cleanup. */
export function bindRipple(target, { color = 'currentColor', duration = 500, signal } = {}) {
  if (!target?.addEventListener) throw new TypeError('target must be an Element');
  if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('duration must be positive');
  signal?.throwIfAborted();
  const animations = new Map();
  const original = {
    overflow: target.style.getPropertyValue('overflow'),
    overflowPriority: target.style.getPropertyPriority('overflow'),
    position: target.style.getPropertyValue('position'),
    positionPriority: target.style.getPropertyPriority('position'),
  };
  if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
  target.style.overflow = 'hidden';
  const down = event => {
    const bounds = target.getBoundingClientRect();
    const diameter = Math.hypot(bounds.width, bounds.height) * 2;
    const ripple = document.createElement('span');
    ripple.setAttribute('aria-hidden', 'true');
    Object.assign(ripple.style, {
      background: color, borderRadius: '50%', height: `${diameter}px`,
      left: `${event.clientX - bounds.left - diameter / 2}px`, pointerEvents: 'none',
      position: 'absolute', top: `${event.clientY - bounds.top - diameter / 2}px`, width: `${diameter}px`,
    });
    target.append(ripple);
    const animation = ripple.animate([
      { opacity: 0.25, transform: 'scale(0)' },
      { opacity: 0, transform: 'scale(1)' },
    ], { duration, easing: 'ease-out' });
    animations.set(ripple, animation);
    animation.finished.catch(() => {}).finally(() => {
      animations.delete(ripple);
      ripple.remove();
    });
  };
  target.addEventListener('pointerdown', down);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    target.removeEventListener('pointerdown', down);
    signal?.removeEventListener('abort', dispose);
    for (const [ripple, animation] of animations) { animation.cancel(); ripple.remove(); }
    animations.clear();
    target.style.setProperty('overflow', original.overflow, original.overflowPriority);
    target.style.setProperty('position', original.position, original.positionPriority);
  };
  signal?.addEventListener('abort', dispose, { once: true });
  return dispose;
}
