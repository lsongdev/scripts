function toPixels(value, containerSize) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  return value.endsWith('%')
    ? (Number.parseFloat(value) / 100) * containerSize
    : Number.parseFloat(value);
}

function resizeDirection(element, x, y, zone) {
  if (!element.hasAttribute('resizable')) return null;
  const rect = element.getBoundingClientRect();
  const directions = element.getAttribute('resizable') || 'both';
  const horizontal = directions !== 'vertical';
  const vertical = directions !== 'horizontal';
  const right = x >= rect.right - zone && x <= rect.right;
  const bottom = y >= rect.bottom - zone && y <= rect.bottom;

  if (horizontal && vertical && right && bottom) return 'both';
  if (horizontal && right) return 'horizontal';
  if (vertical && bottom) return 'vertical';
  return null;
}

/**
 * Experimental Pointer Events based resizing for `[resizable]` descendants.
 */
export function initResizable({
  root = document,
  signal,
  zone = 5,
  minWidth = 0,
  maxWidth = '100%',
  minHeight = 0,
  maxHeight = '100%',
  onResize,
  onResizeStop,
} = {}) {
  signal?.throwIfAborted();
  let active;

  const move = event => {
    if (!active || event.pointerId !== active.pointerId) return;
    const container = active.element.parentElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    if (active.direction === 'horizontal' || active.direction === 'both') {
      const minimum = toPixels(
        active.element.getAttribute('resizable-min-width') ?? minWidth,
        containerRect.width,
      );
      const maximum = toPixels(
        active.element.getAttribute('resizable-max-width') ?? maxWidth,
        containerRect.width,
      );
      const width = Math.max(
        minimum,
        Math.min(active.width + event.clientX - active.x, maximum),
      );
      active.element.style.width = `${width}px`;
    }

    if (active.direction === 'vertical' || active.direction === 'both') {
      const minimum = toPixels(
        active.element.getAttribute('resizable-min-height') ?? minHeight,
        containerRect.height,
      );
      const maximum = toPixels(
        active.element.getAttribute('resizable-max-height') ?? maxHeight,
        containerRect.height,
      );
      const height = Math.max(
        minimum,
        Math.min(active.height + event.clientY - active.y, maximum),
      );
      active.element.style.height = `${height}px`;
    }

    onResize?.(active.element);
    event.preventDefault();
  };

  const start = event => {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest('[resizable]');
    if (!element || !root.contains(element)) return;
    const direction = resizeDirection(element, event.clientX, event.clientY, zone);
    if (!direction) return;

    active = {
      direction,
      element,
      height: element.offsetHeight,
      pointerId: event.pointerId,
      width: element.offsetWidth,
      x: event.clientX,
      y: event.clientY,
    };
    element.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const end = event => {
    if (!active || event.pointerId !== active.pointerId) return;
    const { element } = active;
    element.releasePointerCapture?.(event.pointerId);
    active = undefined;
    onResizeStop?.(element);
  };

  root.addEventListener('pointerdown', start, { signal });
  root.addEventListener('pointermove', move, { signal });
  root.addEventListener('pointerup', end, { signal });
  root.addEventListener('pointercancel', end, { signal });

  return () => {
    root.removeEventListener('pointerdown', start);
    root.removeEventListener('pointermove', move);
    root.removeEventListener('pointerup', end);
    root.removeEventListener('pointercancel', end);
    active = undefined;
  };
}
