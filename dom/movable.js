function finite(value, name) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return value;
}

/** Bind one pointer-draggable handle using CSS translate and viewport-consistent bounds. */
export function bindMovable(handle, {
  target = handle,
  boundary,
  axis = 'both',
  grid = 1,
  x = 0,
  y = 0,
  signal,
} = {}) {
  if (!['both', 'horizontal', 'vertical'].includes(axis)) throw new TypeError('axis must be both, horizontal, or vertical');
  if (!Number.isFinite(grid) || grid <= 0) throw new RangeError('grid must be finite and positive');
  signal?.throwIfAborted();
  let position = { x: finite(x, 'x'), y: finite(y, 'y') };
  let active;
  const originalTouchAction = handle.style.touchAction;
  handle.style.touchAction = 'none';

  const apply = () => { target.style.translate = `${position.x}px ${position.y}px`; };
  const emit = (type, sourceEvent) => handle.dispatchEvent(new CustomEvent(type, {
    bubbles: true, composed: true,
    detail: { position: Object.freeze({ ...position }), sourceEvent, target },
  }));
  const start = event => {
    if (active || event.button !== 0) return;
    active = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      position: { ...position },
      rect: target.getBoundingClientRect(),
      boundaryRect: boundary?.getBoundingClientRect(),
    };
    handle.setPointerCapture(event.pointerId);
    emit('movestart', event);
    event.preventDefault();
  };
  const move = event => {
    if (!active || event.pointerId !== active.pointerId) return;
    let nextX = active.position.x + event.clientX - active.pointerX;
    let nextY = active.position.y + event.clientY - active.pointerY;
    nextX = Math.round(nextX / grid) * grid;
    nextY = Math.round(nextY / grid) * grid;
    if (active.boundaryRect) {
      nextX = Math.max(active.position.x + active.boundaryRect.left - active.rect.left,
        Math.min(nextX, active.position.x + active.boundaryRect.right - active.rect.right));
      nextY = Math.max(active.position.y + active.boundaryRect.top - active.rect.top,
        Math.min(nextY, active.position.y + active.boundaryRect.bottom - active.rect.bottom));
    }
    if (axis !== 'vertical') position.x = nextX;
    if (axis !== 'horizontal') position.y = nextY;
    apply();
    emit('move', event);
    event.preventDefault();
  };
  const end = event => {
    if (!active || event.pointerId !== active.pointerId) return;
    active = undefined;
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    emit('moveend', event);
  };
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
    handle.addEventListener(type, type === 'pointerdown' ? start : type === 'pointermove' ? move : end);
  }
  apply();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    handle.removeEventListener('pointerdown', start);
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', end);
    handle.removeEventListener('pointercancel', end);
    handle.style.touchAction = originalTouchAction;
    active = undefined;
    signal?.removeEventListener('abort', dispose);
  };
  signal?.addEventListener('abort', dispose, { once: true });
  return Object.freeze({
    dispose,
    get position() { return Object.freeze({ ...position }); },
    setPosition(next) {
      position = { x: finite(next.x, 'x'), y: finite(next.y, 'y') };
      apply();
      return this.position;
    },
  });
}
