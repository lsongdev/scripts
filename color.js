
export class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

export const red = new Color(255, 0, 0);
export const green = new Color(0, 255, 0);
export const blue = new Color(0, 0, 255);

export const toHex = color => {
  const { r, g, b } = color;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const toHSL = color => {
  const { r, g, b } = color;
  const r2 = r / 255;
  const g2 = g / 255;
  const b2 = b / 255;
  const max = Math.max(r2, g2, b2);
  const min = Math.min(r2, g2, b2);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const l = (max + min) / 2;
  const h = s === 0 ? 0 : d / (2 - 2 * l);
  return { h, s, l };
};

export const toRGB = color => {
  const { r, g, b } = color;
  return `rgb(${r}, ${g}, ${b})`;
};
