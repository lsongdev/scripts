import { h, useEffect, useRef } from '../react.js';
import { cls } from '../../dom/stylesheets.js';
import { parseAnsi } from '../../text/ansi.js';

// The xterm 256-colour palette beyond the 16 themed ones (log.css).
function color256(n) {
  if (n >= 232) {
    const v = 8 + (n - 232) * 10;
    return `rgb(${v}, ${v}, ${v})`;
  }
  const i = n - 16;
  const level = c => (c === 0 ? 0 : 55 + c * 40);
  return `rgb(${level(Math.floor(i / 36))}, ${level(Math.floor(i / 6) % 6)}, ${level(i % 6)})`;
}

// A colour as a class (the themed 16 and the inverse defaults) or a style.
function colour(value, layer, classes, style) {
  if (value == null) return;
  if (typeof value === 'number' && value < 16) classes.push(`ansi-${layer}-${value}`);
  else if (value === 'inverse-bg' || value === 'inverse-fg') classes.push(`ansi-${layer}-${value === 'inverse-bg' ? 'default-bg' : 'default-fg'}`);
  else style[layer === 'fg' ? 'color' : 'backgroundColor'] = typeof value === 'number' ? color256(value) : value;
}

function ansiText(text) {
  return parseAnsi(text).map(seg => {
    const classes = [];
    const style = {};
    colour(seg.fg, 'fg', classes, style);
    colour(seg.bg, 'bg', classes, style);
    for (const flag of ['bold', 'dim', 'italic', 'underline']) if (seg[flag]) classes.push(`ansi-${flag}`);
    return classes.length || Object.keys(style).length
      ? h('span', { className: classes.join(' ') || undefined, style }, seg.text)
      : seg.text;
  });
}

/**
 * Program output on the console surface (log.css), following new lines
 * while scrolled to the end.
 *
 * lines are strings or `{ text, stream, className, key }`; stream "stderr"
 * marks the line. `ansi` renders terminal colours and drops other escape
 * sequences (each line styled on its own). `renderLine(line, index)` draws
 * a line's content instead, for structured entries (a time, a level, a
 * source). Keys come from `lineKey(line, index)`, then `line.key`, then the
 * index. Where lines come from is up to the caller, e.g. useLineStream.
 */
export function LogView({ lines, follow = true, empty = 'No output', ansi = false, renderLine, lineKey, className = '', ...props }) {
  const ref = useRef(null);
  const pinned = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (el && follow && pinned.current) el.scrollTop = el.scrollHeight;
  }, [lines, follow]);
  const onScroll = event => {
    const el = event.currentTarget;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };
  return h('pre', { ...props, ref, onScroll, className: cls('log', className) }, lines.length
    ? lines.map((raw, i) => {
      const line = typeof raw === 'string' ? { text: raw } : raw;
      const content = renderLine ? renderLine(line, i) : ansi ? ansiText(line.text) : line.text;
      return h('span', {
        key: lineKey?.(line, i) ?? line.key ?? i,
        className: cls('log-line', line.stream === 'stderr' && 'log-stderr', line.className),
      }, content, '\n');
    })
    : h('span', { className: 'muted' }, empty));
}
