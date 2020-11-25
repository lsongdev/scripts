
export const min = () => { };
export const max = () => { };
export const map = () => { };
export const cos = () => { };
export const sin = () => { };

export const floor = x => Math.floor(x);

export const random = () => {
  return Math.random();
};

export const rand = (max, min = 0) => {
  return floor(random() * (max - min) + min);
};
