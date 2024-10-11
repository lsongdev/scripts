// Constants
export const MILLISECONDS_PER_SECOND = 1000;
export const HOURS_PER_DAY = 24;
export const MONTHS_PER_YEAR = 12;
export const MINUTES_PER_HOUR = 60;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR;
export const SECONDS_PER_DAY = MINUTES_PER_DAY * SECONDS_PER_MINUTE;

// Utility functions
export const now = () => Date.now();
export const parse = d => new Date(d);
export const isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

// Date formatting
export function toLocaleDateString(date, locales, options = {}) {
  const defaultOptions = { year: 'numeric', month: 'long', day: 'numeric' };
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

// Date manipulation
function manipulateDate(date, value, unit, timeZone = 'UTC') {
  const d = new Date(date.toLocaleString('en-US', { timeZone }));
  const methods = {
    days: 'Date',
    months: 'Month',
    years: 'FullYear'
  };
  d[`set${methods[unit]}`](d[`get${methods[unit]}`]() + value);
  return d;
}

export const addDays = (date, days, timeZone) => manipulateDate(date, days, 'days', timeZone);
export const addMonths = (date, months, timeZone) => manipulateDate(date, months, 'months', timeZone);
export const addYears = (date, years, timeZone) => manipulateDate(date, years, 'years', timeZone);

// Duration handling
export function duration(ms, units) {
  const millis = Math.abs(ms);
  const millisFraction = millis.toFixed(7).slice(-7, -1);
  if (!units || units.length == 0) { // defaults
    units = ['days', 'hours', 'minutes', 'seconds', 'milliseconds', 'microseconds', 'nanoseconds']
  }
  const result = {};
  let remainder = millis;
  for (const unit of units) {
    switch (unit) {
      case 'days':
        result.days = Math.trunc(remainder / 86400000);
        remainder %= 86400000;
        break;
      case 'hours':
        result.hours = Math.trunc(remainder / 3600000);
        remainder %= 3600000;
        break;
      case 'minutes':
        result.minutes = Math.trunc(remainder / 60000);
        remainder %= 60000;
        break;
      case 'seconds':
        result.seconds = Math.trunc(remainder / 1000);
        remainder %= 1000;
        break;
      case 'milliseconds':
        result.milliseconds = Math.trunc(remainder);
        remainder = 0;
        break;
      case 'microseconds':
        result.microseconds = +millisFraction.slice(0, 3);
        break;
      case 'nanoseconds':
        result.nanoseconds = +millisFraction.slice(3, 6);
        break;
    }
  }
  return result;
}

export function convertDateToDurationObject(date) {
  return {
    years: date.getFullYear(),
    months: date.getMonth() + 1,
    days: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    milliseconds: date.getMilliseconds(),
  };
}

// Formatting
const formatters = {
  y: o => o.years,
  yy: o => String(o.years).padStart(2, '0'),
  yyyy: o => String(o.years).padStart(4, '0'),
  M: o => o.months,
  MM: o => String(o.months).padStart(2, '0'),
  d: o => o.days,
  dd: o => String(o.days).padStart(2, '0'),
  HH: o => String(o.hours).padStart(2, '0'),
  hh: o => String(o.hours % 12 || 12).padStart(2, '0'),
  mm: o => String(o.minutes).padStart(2, '0'),
  s: o => o.seconds,
  ss: o => String(o.seconds).padStart(2, '0'),
  ms: o => o.milliseconds,
  us: o => o.microseconds,
  ns: o => o.nanoseconds,
  time: o => format(o, '{HH}:{mm}:{ss}'),
  date: o => format(o, '{yyyy}-{MM}-{dd}'),
  datetime: o => format(o, '{date} {time}'),
};

export function format(duration, pattern = '{datetime}') {
  duration = duration || new Date;
  const o = duration instanceof Date ? convertDateToDurationObject(duration) : duration;
  return pattern.replace(/\{([^}]+)\}/g, (_, key) => formatters[key]?.(o) ?? _);
};

export const timeago = (t1 = new Date(), options) => {
  const { units } = options;
  const dur = duration(new Date - t1, units);
  // const style = units.map(k => `${dur[k]}${k}`).join(', ');
  // console.log(style);
  return format(dur, "{d}days, {HH}hours, {mm}min, {ss}sec ago");
};
