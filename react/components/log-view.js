import { h, useEffect, useRef } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

/**
 * Program output. lines are strings or { text, stream } objects, where
 * stream "stderr" marks the line. While the view is scrolled to the end it
 * follows new lines. Load log.css.
 */
export function LogView({ lines, follow = true, empty = 'No output', className = '', ...props }) {
  const ref = useRef(null);
  const pinned = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (el && follow && pinned.current) el.scrollTop = el.scrollHeight;
  }, [lines.length, follow]);
  const onScroll = event => {
    const el = event.currentTarget;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };
  return h('pre', { ...props, ref, onScroll, className: cls('log', className) }, lines.length
    ? lines.map(line => (typeof line === 'string'
      ? line + '\n'
      : h('span', { className: line.stream === 'stderr' ? 'log-stderr' : undefined }, line.text + '\n')))
    : h('span', { className: 'muted' }, empty));
}
