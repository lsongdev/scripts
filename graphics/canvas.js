function withState(context, draw) {
  context.save();
  try {
    draw();
  } finally {
    context.restore();
  }
  return context;
}

export function line(context, {
  lineWidth,
  strokeStyle = '#000',
  x1,
  x2,
  y1,
  y2,
}) {
  return withState(context, () => {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = strokeStyle;
    if (lineWidth !== undefined) context.lineWidth = lineWidth;
    context.stroke();
  });
}

export function rect(context, {
  height,
  lineWidth,
  strokeStyle = '#000',
  width,
  x = 0,
  y = 0,
}) {
  return withState(context, () => {
    context.strokeStyle = strokeStyle;
    if (lineWidth !== undefined) context.lineWidth = lineWidth;
    context.strokeRect(x, y, width, height);
  });
}

export function text(context, value, {
  fillStyle = '#000',
  font,
  maxWidth,
  x = 0,
  y = 0,
} = {}) {
  return withState(context, () => {
    context.fillStyle = fillStyle;
    if (font !== undefined) context.font = font;
    if (maxWidth === undefined) context.fillText(String(value), x, y);
    else context.fillText(String(value), x, y, maxWidth);
  });
}

export function image(context, source, {
  height,
  width,
  x = 0,
  y = 0,
} = {}) {
  if (width === undefined && height === undefined) context.drawImage(source, x, y);
  else if (width !== undefined && height !== undefined) {
    context.drawImage(source, x, y, width, height);
  } else {
    throw new TypeError('width and height must be supplied together');
  }
  return context;
}

export function fill(context, {
  fillStyle = '#fff',
  height = context.canvas.height,
  width = context.canvas.width,
  x = 0,
  y = 0,
} = {}) {
  return withState(context, () => {
    context.fillStyle = fillStyle;
    context.fillRect(x, y, width, height);
  });
}

export function clear(context, {
  height = context.canvas.height,
  width = context.canvas.width,
  x = 0,
  y = 0,
} = {}) {
  context.clearRect(x, y, width, height);
  return context;
}
