
import { leftpad } from './string.js';

export const format = (pattern, date = new Date()) => {
  const _year = date.getYear();
  const _fullYear = date.getFullYear();
  const _month = date.getMonth() + 1;
  const _date = date.getDate();
  const _hours = date.getHours();
  const _minutes = date.getMinutes();
  const _seconds = date.getSeconds();
  return pattern.replace(/{(\w+)}/g, (_, name) => ({
    // year
    yy: _year,
    yyyy: _fullYear,
    // month
    M: _month,
    MM: leftpad(_month, 2),
    // date
    d: _date,
    dd: leftpad(_date, 2),
    // hours
    h: _hours % 12,
    hh: leftpad(_hours, 2),
    // minutes
    m: _minutes,
    mm: leftpad(_minutes, 2),
    // seconds
    s: _seconds,
    ss: leftpad(_seconds, 2),
  })[name] || `{${name}}`);
};
