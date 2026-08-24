const booleanAttribute = value => value !== null;
const numberAttribute = value => value === null ? null : Number(value);
const boundaryAttribute = value => {
  if (!value) return null;
  const values = value.split(',').map(part => part.trim());
  if (values.length === 1) return [0, Number(values[0])];
  return values.map(part => part === '' ? null : Number(part));
};

export function getMovableConfig(element) {
  return {
    boundaryElement: element.getAttribute('movable-boundary'),
    boundaryX: boundaryAttribute(element.getAttribute('movable-boundary-x')),
    boundaryY: boundaryAttribute(element.getAttribute('movable-boundary-y')),
    constrainX: booleanAttribute(element.getAttribute('movable-constrain-x')),
    constrainY: booleanAttribute(element.getAttribute('movable-constrain-y')),
    moveTarget: element.getAttribute('movable-target'),
    snapToGrid: numberAttribute(element.getAttribute('movable-snap-to-grid')),
  };
}

function constrainAxis(value, [minimum, maximum], elementSize) {
  return Math.max(
    minimum ?? 0,
    Math.min(value, (maximum ?? Infinity) - elementSize),
  );
}

function constrainPosition(x, y, element, config, root) {
  const elementRect = element.getBoundingClientRect();

  if (config.boundaryElement) {
    const boundary = root.querySelector(config.boundaryElement);
    if (!boundary) {
      throw new ReferenceError(`Movable boundary not found: ${config.boundaryElement}`);
    }
    const rect = boundary.getBoundingClientRect();
    x = Math.max(rect.left, Math.min(x, rect.right - elementRect.width));
    y = Math.max(rect.top, Math.min(y, rect.bottom - elementRect.height));
  }

  if (config.boundaryX) {
    x = constrainAxis(x, config.boundaryX, elementRect.width);
  }
  if (config.boundaryY) {
    y = constrainAxis(y, config.boundaryY, elementRect.height);
  }
  return { x, y };
}

/**
 * Experimental Pointer Events based movement for `[movable]` descendants.
 */
export function initMovable({ root = document, signal } = {}) {
  signal?.throwIfAborted();
  let active;

  const start = event => {
    if (!(event.target instanceof Element)) return;
    const handle = event.target.closest('[movable]');
    if (!handle || !root.contains(handle)) return;

    const config = getMovableConfig(handle);
    const target = config.moveTarget
      ? root.querySelector(config.moveTarget)
      : handle;
    if (!target) {
      throw new ReferenceError(`Movable target not found: ${config.moveTarget}`);
    }

    const rect = target.getBoundingClientRect();
    active = {
      config,
      handle,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
      target,
    };
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const move = event => {
    if (!active || event.pointerId !== active.pointerId) return;
    let x = event.clientX - active.offsetX;
    let y = event.clientY - active.offsetY;

    if (active.config.snapToGrid) {
      x = Math.round(x / active.config.snapToGrid) * active.config.snapToGrid;
      y = Math.round(y / active.config.snapToGrid) * active.config.snapToGrid;
    }
    ({ x, y } = constrainPosition(x, y, active.target, active.config, root));

    active.target.style.position = 'absolute';
    if (!active.config.constrainX) active.target.style.left = `${x}px`;
    if (!active.config.constrainY) active.target.style.top = `${y}px`;
    event.preventDefault();
  };

  const end = event => {
    if (!active || event.pointerId !== active.pointerId) return;
    active.handle.releasePointerCapture?.(event.pointerId);
    active = undefined;
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
