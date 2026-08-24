const powerIn = power => progress => progress ** power;
const powerOut = power => progress => 1 - (1 - progress) ** power;
const powerInOut = power => progress => progress < 0.5
  ? (2 * progress) ** power / 2
  : 1 - (-2 * progress + 2) ** power / 2;

export const linear = progress => progress;
export const quadIn = powerIn(2);
export const quadOut = powerOut(2);
export const quadInOut = powerInOut(2);
export const cubicIn = powerIn(3);
export const cubicOut = powerOut(3);
export const cubicInOut = powerInOut(3);
export const quartIn = powerIn(4);
export const quartOut = powerOut(4);
export const quartInOut = powerInOut(4);
export const quintIn = powerIn(5);
export const quintOut = powerOut(5);
export const quintInOut = powerInOut(5);
export const sineIn = progress => 1 - Math.cos(progress * Math.PI / 2);
export const sineOut = progress => Math.sin(progress * Math.PI / 2);
export const sineInOut = progress => -(Math.cos(Math.PI * progress) - 1) / 2;

export function bounceOut(progress) {
  const scale = 7.5625;
  const divisor = 2.75;
  if (progress < 1 / divisor) return scale * progress ** 2;
  if (progress < 2 / divisor) return scale * (progress - 1.5 / divisor) ** 2 + 0.75;
  if (progress < 2.5 / divisor) return scale * (progress - 2.25 / divisor) ** 2 + 0.9375;
  return scale * (progress - 2.625 / divisor) ** 2 + 0.984375;
}

export const bounceIn = progress => 1 - bounceOut(1 - progress);
export const bounceInOut = progress => progress < 0.5
  ? (1 - bounceOut(1 - 2 * progress)) / 2
  : (1 + bounceOut(2 * progress - 1)) / 2;
