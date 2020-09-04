
export const format = (pattern, date = new Date()) =>
  pattern.replace(/{(\w+)}/g, (_, name) => ({
    yyyy: date.getFullYear(),
    yy: date.getYear(),
    MM: date.getMonth() + 1,
    dd: date.getDate(),
    hh: date.getHours(),
    mm: date.getMinutes(),
    ss: date.getSeconds(),
  })[name] || `{${name}}`);