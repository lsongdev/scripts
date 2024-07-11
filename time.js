import { leftpad } from './string.js';

export const parse = d => new Date(d);

export function format(pattern, date = new Date) {
  const zeroPad = n => leftpad(n, 2, '0');
  const _ = {
    yyyy: () => date.getFullYear(),
    M: () => date.getMonth() + 1,
    MM: () => zeroPad(date.getMonth() + 1),
    d: () => date.getDate(),
    dd: () => zeroPad(date.getDate()),
    HH: () => date.getHours(),
    hh: () => date.getHours(),
    mm: () => zeroPad(date.getMinutes()),
    ss: () => date.getSeconds(),
  };
  return pattern.replace(/\{([^\}]+)\}/g, (x, m) => _[m] && _[m]());
}

export const today = () => format('{yyyy}-{MM}-{dd}');
export const now = () => format('{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}');

export const isLeapYear = year =>
  year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const TIME_AGO = {
  now: "just now",
  seconds: "%d seconds ago",
  minute: "a minute ago",
  minutes: "%d minutes ago",
  hour: "an hour ago",
  hours: "%d hours ago",
  day: "a day ago",
  days: "%d days ago",
  month: "a month ago",
  months: "%d months ago",
  year: "a year ago",
  years: "%d years ago",
};

const TIME_IN_FUTURE = {
  seconds: "in %d seconds",
  minute: "in a minute",
  minutes: "in %d minutes",
  hour: "in an hour",
  hours: "in %d hours",
  day: "in a day",
  days: "in %d days",
  month: "in a month",
  months: "in %d months",
  year: "in a year",
  years: "in %d years",
};

export const timeago = (t1 = new Date(), t2 = new Date()) => {
  const diffInSeconds = (t1 - t2) / 1000;
  const isFuture = diffInSeconds > 0;
  const absDiffInSeconds = Math.abs(diffInSeconds);
  const minutes = (absDiffInSeconds / 60) | 0;
  const hours = (minutes / 60) | 0;
  const days = (hours / 24) | 0;
  const months = (days / 30) | 0;
  const years = (days / 365) | 0;
  const timeTemplates = isFuture ? TIME_IN_FUTURE : TIME_AGO;
  const template = (name, n) => timeTemplates[name].replace('%d', n);
  return (
    absDiffInSeconds < 1.5 && template('now', 1) ||
    absDiffInSeconds < 45 && template('seconds', absDiffInSeconds) ||
    absDiffInSeconds < 90 && template('minute', 1) ||
    minutes < 45 && template('minutes', minutes) ||
    minutes < 90 && template('hour', 1) ||
    hours < 24 && template('hours', hours) ||
    hours < 42 && template('day', 1) ||
    days < 30 && template('days', days) ||
    days < 45 && template('month', 1) ||
    days < 365 && template('months', months) ||
    years < 1.5 && template('year', 1) ||
    template('years', years)
  );
};
