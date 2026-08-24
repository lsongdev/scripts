function channel(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > 255) {
    throw new RangeError(`${name} must be between 0 and 255`);
  }
  return Math.round(value);
}

/** Immutable sRGB color with an optional alpha channel. */
export class Color {
  constructor(red, green, blue, alpha = 1) {
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      throw new RangeError('alpha must be between 0 and 1');
    }
    this.red = channel(red, 'red');
    this.green = channel(green, 'green');
    this.blue = channel(blue, 'blue');
    this.alpha = alpha;
    Object.freeze(this);
  }
}

export const red = new Color(255, 0, 0);
export const green = new Color(0, 255, 0);
export const blue = new Color(0, 0, 255);

export function color(value) {
  if (value instanceof Color) return value;
  return new Color(
    value.red ?? value.r,
    value.green ?? value.g,
    value.blue ?? value.b,
    value.alpha ?? value.a ?? 1,
  );
}

/** Parse #rgb, #rgba, #rrggbb, or #rrggbbaa into a Color. */
export function parseHex(value) {
  const match = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value);
  if (!match) throw new SyntaxError(`Invalid hexadecimal color: ${value}`);
  let digits = match[1];
  if (digits.length <= 4) digits = [...digits].map(digit => digit + digit).join('');
  const hasAlpha = digits.length === 8;
  return new Color(
    Number.parseInt(digits.slice(0, 2), 16),
    Number.parseInt(digits.slice(2, 4), 16),
    Number.parseInt(digits.slice(4, 6), 16),
    hasAlpha ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1,
  );
}

export function toHex(value, { alpha = color(value).alpha < 1 } = {}) {
  const resolved = color(value);
  const values = [resolved.red, resolved.green, resolved.blue];
  if (alpha) values.push(Math.round(resolved.alpha * 255));
  return `#${values.map(item => item.toString(16).padStart(2, '0')).join('')}`;
}

export function toRGB(value) {
  const resolved = color(value);
  return resolved.alpha === 1
    ? `rgb(${resolved.red} ${resolved.green} ${resolved.blue})`
    : `rgb(${resolved.red} ${resolved.green} ${resolved.blue} / ${resolved.alpha})`;
}

/** Return CSS-style HSL: hue in degrees, saturation/lightness in [0, 1]. */
export function toHSL(value) {
  const resolved = color(value);
  const r = resolved.red / 255;
  const g = resolved.green / 255;
  const b = resolved.blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = 0;
  if (delta) {
    if (maximum === r) hue = 60 * ((g - b) / delta % 6);
    else if (maximum === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return Object.freeze({ alpha: resolved.alpha, hue, lightness, saturation });
}
