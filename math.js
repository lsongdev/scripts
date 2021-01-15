
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

export const randomId = (len = 8, str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') => {
  var result = '';
  const chars = str.split('');
  while (result.length < len) {
    const i = rand(chars.length - 1);
    result += chars[i];
  }
  return result;
};

export const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
