const aliases = Object.freeze({
  date: '{yyyy}-{MM}-{dd}',
  datetime: '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}',
  time: '{HH}:{mm}:{ss}',
});

/** Parse a date-like value and reject invalid instants explicitly. */
export function parseDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Invalid date: ${value}`);
  return date;
}

export const now = () => new Date();

/** Return Gregorian date/time fields in an explicit IANA time zone. */
export function dateParts(value, { timeZone } = {}) {
  const date = parseDate(value);
  const formatter = new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    minute: '2-digit', month: '2-digit', numberingSystem: 'latn',
    second: '2-digit', timeZone, year: 'numeric',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date)
    .filter(part => part.type !== 'literal')
    .map(part => [part.type, Number(part.value)]));
  return Object.freeze({
    day: parts.day, hour: parts.hour, millisecond: date.getUTCMilliseconds(),
    minute: parts.minute, month: parts.month, second: parts.second, year: parts.year,
  });
}

const pad = (value, width = 2) => String(value).padStart(width, '0');

/** Format a non-negative elapsed time in whole seconds as minutes and seconds. */
export function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) throw new TypeError('totalSeconds must be finite');
  const value = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** Format a date with the small documented token set or a named alias. */
export function formatDate(value, pattern = '{datetime}', { timeZone } = {}) {
  const parts = dateParts(value, { timeZone });
  const tokens = {
    d: parts.day, dd: pad(parts.day), h: parts.hour,
    hh: pad(parts.hour % 12 || 12), HH: pad(parts.hour), M: parts.month,
    MM: pad(parts.month), m: parts.minute, mm: pad(parts.minute),
    ms: parts.millisecond, s: parts.second, ss: pad(parts.second),
    y: parts.year, yy: pad(parts.year % 100), yyyy: pad(parts.year, 4),
  };
  const alias = /^\{(date|time|datetime)\}$/.exec(pattern)?.[1];
  const resolved = alias ? aliases[alias] : pattern;
  return resolved.replace(/\{([^}]+)\}/g, (token, name) =>
    Object.hasOwn(tokens, name) ? tokens[name] : token);
}

/** Describe the signed elapsed duration from source to target. */
export function difference(target, source = new Date()) {
  const total = parseDate(target).getTime() - parseDate(source).getTime();
  let remaining = Math.abs(total);
  const days = Math.floor(remaining / 86_400_000);
  remaining %= 86_400_000;
  const hours = Math.floor(remaining / 3_600_000);
  remaining %= 3_600_000;
  const minutes = Math.floor(remaining / 60_000);
  remaining %= 60_000;
  const seconds = Math.floor(remaining / 1_000);
  return Object.freeze({
    days, hours, milliseconds: remaining % 1_000, minutes, seconds,
    sign: Math.sign(total), totalMilliseconds: total,
  });
}

/** Format a duration without discarding whether it is past or future. */
export function formatDuration(duration, {
  separator = '', showSign = true,
  units = { day: 'd', hour: 'h', minute: 'm', second: 's' },
} = {}) {
  const sign = showSign && duration.sign < 0 ? '-' : '';
  if (separator === ':') {
    const values = duration.days
      ? [duration.days, pad(duration.hours), pad(duration.minutes), pad(duration.seconds)]
      : duration.hours
        ? [duration.hours, pad(duration.minutes), pad(duration.seconds)]
        : [duration.minutes, pad(duration.seconds)];
    return sign + values.join(separator);
  }
  const values = [];
  if (duration.days) values.push(`${duration.days}${units.day ?? ''}`);
  if (duration.hours) values.push(`${duration.hours}${units.hour ?? ''}`);
  if (duration.minutes) values.push(`${duration.minutes}${units.minute ?? ''}`);
  if (duration.seconds) values.push(`${duration.seconds}${units.second ?? ''}`);
  return sign + (values.join(separator) || `0${units.second ?? ''}`);
}
