function size(value, name, fallback) {
  const result = value ?? fallback;
  if (!Number.isFinite(result) || result < 0) throw new RangeError(`${name} must be finite and non-negative`);
  return result;
}

/** Bind one resize handle with explicit border-box limits and pointer ownership. */
export function bindResizable(handle, {
  target = handle,
  boundary,
  axes = 'both',
  minWidth = 0,
  maxWidth = Number.MAX_SAFE_INTEGER,
  minHeight = 0,
  maxHeight = Number.MAX_SAFE_INTEGER,
  signal,
} = {}) {
  if (!['both', 'horizontal', 'vertical'].includes(axes)) throw new TypeError('axes must be both, horizontal, or vertical');
  minWidth = size(minWidth, 'minWidth', 0);
  maxWidth = size(maxWidth, 'maxWidth', Number.MAX_SAFE_INTEGER);
  minHeight = size(minHeight, 'minHeight', 0);
  maxHeight = size(maxHeight, 'maxHeight', Number.MAX_SAFE_INTEGER);
  if (minWidth > maxWidth || minHeight > maxHeight) throw new RangeError('minimum size cannot exceed maximum size');
  signal?.throwIfAborted();
  const originalTouchAction = handle.style.touchAction;
  handle.style.touchAction = 'none';
  let active;

  const emit = (type, sourceEvent) => handle.dispatchEvent(new CustomEvent(type, {
    bubbles: true, composed: true,
    detail: { height: target.getBoundingClientRect().height, sourceEvent, target, width: target.getBoundingClientRect().width },
  }));
  const start = event => {
    if (active || event.button !== 0) return;
    const rect = target.getBoundingClientRect();
    const computed = getComputedStyle(target);
    const widthExtra = computed.boxSizing === 'border-box' ? 0
      : ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']
        .reduce((total, property) => total + Number.parseFloat(computed[property]), 0);
    const heightExtra = computed.boxSizing === 'border-box' ? 0
      : ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
        .reduce((total, property) => total + Number.parseFloat(computed[property]), 0);
    const boundaryRect = boundary?.getBoundingClientRect();
    if (boundaryRect && (boundaryRect.right - rect.left < minWidth
      || boundaryRect.bottom - rect.top < minHeight)) {
      throw new RangeError('boundary is smaller than the configured minimum size');
    }
    active = {
      pointerId: event.pointerId,
      x: event.clientX, y: event.clientY,
      width: rect.width, height: rect.height,
      widthExtra,
      heightExtra,
      boundaryRect,
      rect,
    };
    handle.setPointerCapture(event.pointerId);
    emit('resizestart', event);
    event.preventDefault();
  };
  const move = event => {
    if (!active || event.pointerId !== active.pointerId) return;
    const boundaryWidth = active.boundaryRect ? active.boundaryRect.right - active.rect.left : maxWidth;
    const boundaryHeight = active.boundaryRect ? active.boundaryRect.bottom - active.rect.top : maxHeight;
    const width = Math.max(minWidth, Math.min(active.width + event.clientX - active.x, maxWidth, boundaryWidth));
    const height = Math.max(minHeight, Math.min(active.height + event.clientY - active.y, maxHeight, boundaryHeight));
    if (axes !== 'vertical') target.style.width = `${Math.max(0, width - active.widthExtra)}px`;
    if (axes !== 'horizontal') target.style.height = `${Math.max(0, height - active.heightExtra)}px`;
    emit('resize', event);
    event.preventDefault();
  };
  const end = event => {
    if (!active || event.pointerId !== active.pointerId) return;
    active = undefined;
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    emit('resizeend', event);
  };
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
    handle.addEventListener(type, type === 'pointerdown' ? start : type === 'pointermove' ? move : end);
  }
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
  return dispose;
}
