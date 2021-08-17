import { leftpad } from './string.js';

export const parse = str => Date.parse(str);
export const toObject = (date = new Date) => {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    week: date.getDay(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
  };
};

export const format = (pattern, date = new Date) => {
  if (date instanceof Date) date = toObject(date);
  const builtin = {
    // year
    yyyy: date.year,
    // month
    M: date.month,
    MM: leftpad(date.month, 2),
    // date
    d: date.day,
    dd: leftpad(date.day, 2),
    // hours
    H: date.hour,
    HH: leftpad(date.hour, 2),
    h: date.hour % 12,
    hh: leftpad(date.hour % 12),
    // minutes
    m: date.minute,
    mm: leftpad(date.minute, 2),
    // seconds
    s: date.second,
    ss: leftpad(date.second, 2),
  };
  return pattern.replace(/{(\w+)}/g, (_, name) => builtin[name] || date[name]);
};

export function diff(pattern, t1 = Date.now(), t2 = 0) {
  const diff = t1 - t2;
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hour = Math.floor(diff / (1000 * 60 * 60) % 24);
  const minute = Math.floor(diff / (1000 * 60) % 60);
  const second = Math.floor(diff / 1000 % 60);
  const millisecond = Math.floor(diff % 1000);
  return format(pattern, {
    day,
    hour,
    minute,
    second,
    millisecond,
  });
};

export const timeago = () => {
  
};

export function isLeapYear(year) {
  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    return true;
  } else {
    return false;
  }
}
