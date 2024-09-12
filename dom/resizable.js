function convertToPx(value, containerSize) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.endsWith('%')) {
      return (parseFloat(value) / 100) * containerSize;
    }
    return parseFloat(value);
  }
  return null;
}

// 获取调整方向
function getResizeDirection(element, x, y, zone = 5) {
  if (!element.hasAttribute('resizable')) return null;
  const rect = element.getBoundingClientRect();
  const resizeDirections = element.getAttribute('resizable') || 'both';
  const canResizeHorizontal = resizeDirections !== 'vertical';
  const canResizeVertical = resizeDirections !== 'horizontal';

  const inRightZone = x >= rect.right - zone && x <= rect.right;
  const inBottomZone = y >= rect.bottom - zone && y <= rect.bottom;

  if (canResizeHorizontal && canResizeVertical && inRightZone && inBottomZone) {
    return 'both';
  } else if (canResizeHorizontal && inRightZone) {
    return 'horizontal';
  } else if (canResizeVertical && inBottomZone) {
    return 'vertical';
  }

  return null;
}

// 更新光标样式
function updateCursorStyle(e) {
  const resizeDirection = getResizeDirection(e.target, e.clientX, e.clientY);
  if (resizeDirection === 'horizontal') {
    document.body.style.cursor = 'ew-resize';
  } else if (resizeDirection === 'vertical') {
    document.body.style.cursor = 'ns-resize';
  } else if (resizeDirection === 'both') {
    document.body.style.cursor = 'nwse-resize';
  } else {
    document.body.style.cursor = 'default';
  }
}

// 主要的 resize 函数
export function initResizable(options = {}) {
  let isResizing = false;
  let currentElement = null;
  let currentDirection = null;
  let startSize = null;
  let startPosition = null;

  function onMouseMove(e) {
    if (!isResizing) {
      updateCursorStyle(e);
      return;
    };
    const containerRect = currentElement.parentElement.getBoundingClientRect();
    const minWidth = currentElement.getAttribute('resizable-min-width') || options.minWidth || 0;
    const maxWidth = currentElement.getAttribute('resizable-max-width') || options.maxWidth || '100%';
    const minHeight = currentElement.getAttribute('resizable-min-height') || options.minHeight || 0;
    const maxHeight = currentElement.getAttribute('resizable-max-height') || options.maxHeight || '100%';

    if (currentDirection === 'horizontal' || currentDirection === 'both') {
      const differenceX = e.clientX - startPosition.x;
      let newWidth = startSize.width + differenceX;
      const minWidthPx = convertToPx(minWidth, containerRect.width);
      const maxWidthPx = convertToPx(maxWidth, containerRect.width);
      newWidth = Math.max(minWidthPx, Math.min(newWidth, maxWidthPx));
      currentElement.style.width = `${newWidth}px`;
    }

    if (currentDirection === 'vertical' || currentDirection === 'both') {
      const differenceY = e.clientY - startPosition.y;
      let newHeight = startSize.height + differenceY;
      const minHeightPx = convertToPx(minHeight, containerRect.height);
      const maxHeightPx = convertToPx(maxHeight, containerRect.height);
      newHeight = Math.max(minHeightPx, Math.min(newHeight, maxHeightPx));
      currentElement.style.height = `${newHeight}px`;
    }

    if (options.onResize) {
      options.onResize(currentElement);
    }
  }

  function onMouseDown(e) {
    if (e.target.hasAttribute('resizable')) {
      const direction = getResizeDirection(e.target, e.clientX, e.clientY);
      if (direction) {
        isResizing = true;
        currentElement = e.target;
        currentDirection = direction;
        startSize = {
          width: currentElement.offsetWidth,
          height: currentElement.offsetHeight
        };
        startPosition = {
          x: e.clientX,
          y: e.clientY
        };
        e.preventDefault();
      }
    }
  }

  function onMouseUp() {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = 'default';
      if (options.onResizeStop && currentElement) {
        options.onResizeStop(currentElement);
      }
      currentElement = null;
      currentDirection = null;
    }
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);

  return function cleanup() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
  };
}

if (document.querySelector('[resizable-auto-init]')) {
  initResizable();
}
