import { leftpad } from './string.js';

const TIME = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_MONTH: 30, // Approximate
  DAYS_PER_YEAR: 365,
  MONTHS_PER_YEAR: 12
};

const DATE_FORMATS = [
  { regex: /^(\d{4})-(\d{2})-(\d{2})$/, handler: ([, y, m, d]) => new Date(y, m - 1, d) },
  { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, handler: ([, m, d, y]) => new Date(y, m - 1, d) },
  {
    regex: /^(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{4})$/,
    handler: ([, d, m, y]) => new Date(y, "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m) / 3, d)
  }
];

export function parse(dateString) {
  if (dateString instanceof Date) return dateString;
  if (typeof dateString === 'number') return new Date(dateString);

  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) return isoDate;

  for (const { regex, handler } of DATE_FORMATS) {
    const match = dateString.match(regex);
    if (match) {
      const result = handler(match);
      if (!isNaN(result.getTime())) return result;
    }
  }

  throw new Error(`Unable to parse date string: ${dateString}`);
}

const formatters = {
  yyyy: date => date.getFullYear(),
  M: date => date.getMonth() + 1,
  MM: date => leftpad(date.getMonth() + 1, 2, '0'),
  d: date => date.getDate(),
  dd: date => leftpad(date.getDate(), 2, '0'),
  HH: date => leftpad(date.getHours(), 2, '0'),
  hh: date => leftpad(date.getHours() % 12 || 12, 2, '0'),
  mm: date => leftpad(date.getMinutes(), 2, '0'),
  ss: date => leftpad(date.getSeconds(), 2, '0'),
};

export function format(pattern, date = new Date()) {
  return pattern.replace(/\{([^\}]+)\}/g, (_, key) => formatters[key]?.(date) ?? _);
}

export const today = () => format('{yyyy}-{MM}-{dd}');
export const now = () => format('{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}');

export const isLeapYear = year =>
  year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const TIME_TEMPLATES = {
  now: { past: "just now", future: "just now" },
  seconds: { past: "%d seconds ago", future: "in %d seconds" },
  minute: { past: "a minute ago", future: "in a minute" },
  minutes: { past: "%d minutes ago", future: "in %d minutes" },
  hour: { past: "an hour ago", future: "in an hour" },
  hours: { past: "%d hours ago", future: "in %d hours" },
  day: { past: "a day ago", future: "in a day" },
  days: { past: "%d days ago", future: "in %d days" },
  month: { past: "a month ago", future: "in a month" },
  months: { past: "%d months ago", future: "in %d months" },
  year: { past: "a year ago", future: "in a year" },
  years: { past: "%d years ago", future: "in %d years" },
};

export const timeago = (t1 = new Date(), t2 = new Date()) => {
  const diffInSeconds = (t1 - t2) / TIME.MILLISECONDS_PER_SECOND;
  const isFuture = diffInSeconds > 0;
  const absDiffInSeconds = Math.abs(diffInSeconds);

  const getTimeUnit = (value, unit, singularThreshold = 1.5) =>
    value < singularThreshold ? unit : `${unit}s`;

  const formatTime = (value, unit) => {
    const timeKey = getTimeUnit(value, unit);
    const direction = isFuture ? 'future' : 'past';
    return TIME_TEMPLATES[timeKey][direction].replace('%d', Math.round(value));
  };

  if (absDiffInSeconds < 45) return formatTime(absDiffInSeconds, 'second');

  const minutes = absDiffInSeconds / TIME.SECONDS_PER_MINUTE;
  if (minutes < 45) return formatTime(minutes, 'minute');

  const hours = minutes / TIME.MINUTES_PER_HOUR;
  if (hours < 22) return formatTime(hours, 'hour');

  const days = hours / TIME.HOURS_PER_DAY;
  if (days < 26) return formatTime(days, 'day');

  const months = days / TIME.DAYS_PER_MONTH;
  if (months < 11) return formatTime(months, 'month');

  const years = days / TIME.DAYS_PER_YEAR;
  return formatTime(years, 'year');
};

export function toLocaleDateString(date, locales, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Date(date).toLocaleDateString(locales, { ...defaultOptions, ...options });
}

export function formatToLocale(date, locales, format = 'full') {
  const options = {
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    short: { year: '2-digit', month: 'numeric', day: 'numeric' }
  };
  return toLocaleDateString(date, locales, options[format] || options.full);
}

function manipulateDate(date, value, unit, timeZone = 'UTC') {
  const d = new Date(date.toLocaleString('en-US', { timeZone }));
  const methods = {
    'days': 'Date',
    'months': 'Month',
    'years': 'FullYear'
  };
  d[`set${methods[unit]}`](d[`get${methods[unit]}`]() + value);
  return d;
}

export const addDays = (date, days, timeZone) => manipulateDate(date, days, 'days', timeZone);
export const addMonths = (date, months, timeZone) => manipulateDate(date, months, 'months', timeZone);
export const addYears = (date, years, timeZone) => manipulateDate(date, years, 'years', timeZone);
