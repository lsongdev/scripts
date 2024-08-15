// 配置解析器
const ConfigParser = {
  parseBoolean: (value) => value !== null,
  parseNumber: (value) => value !== null ? parseInt(value, 10) : null,
  parseBoundary: (value) => {
    if (!value) return null;
    const parts = value.split(',').map(v => v.trim());
    if (parts.length === 1) {
      // 如果只有一个值，将其解释为最大值
      return [0, parseInt(parts[0], 10)];
    }
    return parts.map(v => v === '' ? null : parseInt(v, 10));
  },
  parseSelector: (value) => value,
};

// 配置定义
const CONFIG_DEFINITIONS = {
  moveTarget: { attr: 'movable-target', parser: ConfigParser.parseSelector },
  constrainX: { attr: 'movable-constrain-x', parser: ConfigParser.parseBoolean },
  constrainY: { attr: 'movable-constrain-y', parser: ConfigParser.parseBoolean },
  snapToGrid: { attr: 'movable-snap-to-grid', parser: ConfigParser.parseNumber },
  boundaryElement: { attr: 'movable-boundary', parser: ConfigParser.parseSelector },
  boundaryX: { attr: 'movable-boundary-x', parser: ConfigParser.parseBoundary },
  boundaryY: { attr: 'movable-boundary-y', parser: ConfigParser.parseBoundary },
};

// 获取可移动元素的配置
export function getMovableConfig(element) {
  return Object.fromEntries(
    Object.entries(CONFIG_DEFINITIONS).map(([key, { attr, parser }]) => [
      key,
      parser(element.getAttribute(attr))
    ])
  );
}

// 边界约束应用器
const BoundaryConstraints = {
  applyElementBoundary: (newX, newY, elementRect, boundaryRect) => ({
    x: Math.max(boundaryRect.left, Math.min(newX, boundaryRect.right - elementRect.width)),
    y: Math.max(boundaryRect.top, Math.min(newY, boundaryRect.bottom - elementRect.height))
  }),
  
  applyAxisBoundary: (value, [min, max], elementSize) => 
    Math.max(min ?? 0, Math.min(value, (max ?? Infinity) - elementSize)),

  apply: (newX, newY, element, config) => {
    const elementRect = element.getBoundingClientRect();
    let x = newX, y = newY;

    if (config.boundaryElement) {
      const boundaryRect = document.querySelector(config.boundaryElement).getBoundingClientRect();
      ({ x, y } = BoundaryConstraints.applyElementBoundary(x, y, elementRect, boundaryRect));
    }

    if (config.boundaryX) {
      x = BoundaryConstraints.applyAxisBoundary(x, config.boundaryX, elementRect.width);
    }

    if (config.boundaryY) {
      y = BoundaryConstraints.applyAxisBoundary(y, config.boundaryY, elementRect.height);
    }

    return { x, y };
  }
};

// 移动处理器
const MoveHandler = {
  start: (e) => {
    const movableElement = e.target.closest('[movable]');
    if (!movableElement) return null;
    e.preventDefault();
    const config = getMovableConfig(movableElement);
    const target = config.moveTarget ? document.querySelector(config.moveTarget) : movableElement;
    const rect = target.getBoundingClientRect();
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;

    return {
      target,
      config,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  },

  move: (e, movable) => {
    if (!movable) return;

    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;

    let newX = clientX - movable.offsetX;
    let newY = clientY - movable.offsetY;

    if (movable.config.snapToGrid) {
      newX = Math.round(newX / movable.config.snapToGrid) * movable.config.snapToGrid;
      newY = Math.round(newY / movable.config.snapToGrid) * movable.config.snapToGrid;
    }
    const { x, y } = BoundaryConstraints.apply(newX, newY, movable.target, movable.config);
    movable.target.style.position = 'absolute';
    if (!movable.config.constrainX) movable.target.style.left = `${x}px`;
    if (!movable.config.constrainY) movable.target.style.top = `${y}px`;
  }
};

// 初始化函数
export function initMovable() {
  let currentMovable = null;

  const handleStart = (e) => {
    currentMovable = MoveHandler.start(e);
  };

  const handleMove = (e) => {
    MoveHandler.move(e, currentMovable);
  };

  const handleEnd = () => {
    currentMovable = null;
  };

  // 事件监听器
  document.addEventListener('mousedown', handleStart);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  document.addEventListener('touchstart', handleStart, { passive: false });
  document.addEventListener('touchmove', handleMove, { passive: false });
  document.addEventListener('touchend', handleEnd);

  // 防止移动端的滚动
  document.body.addEventListener('touchmove', (e) => {
    if (currentMovable) e.preventDefault();
  }, { passive: false });
}

// 检查是否需要自动初始化
if (document.querySelector('[movable-auto-init]')) {
  initMovable();
}
