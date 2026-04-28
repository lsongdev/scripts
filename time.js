export const now = () => new Date();

export const parse = (d) => new Date(d);

export function toDateObject(date, timeZone) {
  const d = parse(date);
  if (timeZone && timeZone !== 'UTC') {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(d);
    const vals = {};
    parts.forEach(p => { vals[p.type] = +p.value; });
    return {
      years: vals.year,
      months: vals.month,
      days: vals.day,
      hours: vals.hour,
      minutes: vals.minute,
      seconds: vals.second,
      milliseconds: d.getMilliseconds()
    };
  }
  return {
    years: d.getFullYear(),
    months: d.getMonth() + 1,
    days: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
    seconds: d.getSeconds(),
    milliseconds: d.getMilliseconds()
  };
}

const pad2 = n => String(n).padStart(2, '0');

const formatters = {
  y: o => o.years, yy: o => pad2(o.years % 100), yyyy: o => String(o.years).padStart(4, '0'),
  M: o => o.months, MM: o => pad2(o.months),
  d: o => o.days, dd: o => pad2(o.days),
  h: o => o.hours, HH: o => pad2(o.hours), hh: o => pad2(o.hours % 12 || 12),
  m: o => o.minutes, mm: o => pad2(o.minutes),
  s: o => o.seconds, ss: o => pad2(o.seconds),
  ms: o => o.milliseconds,
  date: o => formatters.yyyy(o) + '-' + formatters.MM(o) + '-' + formatters.dd(o),
  time: o => formatters.HH(o) + ':' + formatters.mm(o) + ':' + formatters.ss(o),
  datetime: o => formatters.date(o) + ' ' + formatters.time(o),
};

const patterns = {
  date: '{yyyy}-{MM}-{dd}',
  time: '{HH}:{mm}:{ss}',
  datetime: '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}',
};

export function format(date, pattern = '{datetime}', timeZone) {
  const o = date instanceof Date ? toDateObject(date, timeZone) : date;
  pattern = patterns[pattern.slice(1, -1)] || pattern;
  return pattern.replace(/\{([^}]+)\}/g, (_, k) => formatters[k]?.(o) ?? _);
}

export function diff(target, source = new Date(), timeZone) {
  const ms = target - source;
  const sign = ms < 0 ? -1 : 1;
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  return { sign, days, hours, minutes, seconds, milliseconds: abs % 1000 };
}

export function formatDiff(d, sep = '', units = {d: 'd', h: 'h', m: 'm', s: 's'}) {
  const pad = (n) => String(n).padStart(2, '0');
  const join = (p) => p.join(sep);

  if (sep === ':') {
    if (d.days) return join([d.days, pad(d.hours), pad(d.minutes), pad(d.seconds)]);
    if (d.hours) return join([d.hours, pad(d.minutes), pad(d.seconds)]);
    return join([d.minutes, pad(d.seconds)]);
  }
  const parts = [];
  if (d.days) parts.push(`${d.days}${units.d || ''}`);
  if (d.hours) parts.push(`${d.hours}${units.h || ''}`);
  if (d.minutes) parts.push(`${d.minutes}${units.m || ''}`);
  if (d.seconds) parts.push(`${d.seconds}${units.s || ''}`);
  return parts.length ? join(parts) : '0s';
}