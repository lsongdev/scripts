
export const line = (ctx, x, y, x1, y1, color = '#000') => {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.stroke();
  return ctx;
};

export const rect = (ctx, { x = 0, y = 0, width, height, color = '#000' }) => {
  line(ctx, x, y, x + width, y, color);
  line(ctx, x + width, y, x + width, y + height, color);
  line(ctx, x + width, y + height, x, y + height, color);
  line(ctx, x, y + height, x, y, color);
  return ctx;
};

export const text = (ctx, text, { x = 0, y = 0, color = '#000', size = '16px', family = 'serif', maxWidth }) => {
  ctx.font = `${size} ${family}`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxWidth);
  return ctx;
};

export const image = (ctx, img, { x = 0, y = 0, width, height } = ctx.canvas) => {
  ctx.drawImage(img, x, y, width, height);
  return ctx;
};

export const fill = (ctx, { x = 0, y = 0, width, height, color } = {}) => {
  width = width || ctx.canvas.width;
  height = height || ctx.canvas.height;
  ctx.fillStyle = color || 'white';
  ctx.fillRect(x, y, width, height);
  ctx.stroke();
  return ctx;
};

export const clear = (ctx, { x = 0, y = 0, width, height } = ctx.canvas) => {
  ctx.clearRect(x, y, width, height);
  return ctx;
};