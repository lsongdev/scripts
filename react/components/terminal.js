import { h, useEffect, useRef, useState } from '../react.js';
import { cls } from '../../dom/stylesheets.js';

// Stylesheets already added, by root (a document or a shadow root).
const added = new WeakMap();

// Adds the emulator's stylesheet where the terminal renders: document
// styles do not reach into a shadow root, so a terminal inside one needs
// its own copy. Each root gets it once.
function addStyleSheet(element, href) {
  const root = element.getRootNode();
  const target = root instanceof ShadowRoot ? root : document.head;
  const hrefs = added.get(root) ?? new Set();
  added.set(root, hrefs);
  if (hrefs.has(href)) return;
  hrefs.add(href);
  target.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
}

/**
 * A terminal emulator (xterm.js) on the console surface (`.terminal-frame`,
 * log.css), filling it and refitting as it resizes. The library does not
 * bundle xterm: `load` resolves to `{ Terminal, FitAddon }` from the
 * application's copy and `css` is the URL of its xterm.css, so xterm is
 * fetched only when a terminal opens.
 *
 * `connect(term)` attaches the session (a WebSocket, a process, a replay) to
 * the xterm instance, writing output with `term.write` and listening with
 * `term.onData` / `term.onResize`, and returns a function that detaches it.
 * It runs once per mount: give the component a new `key` to reconnect.
 * `readOnly` shows output without taking input. `options` go to xterm.
 * `onError` receives a failure to load the emulator.
 */
export function Terminal({ load, css, connect, readOnly = false, options, onError, className = '', ...props }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    if (css) addStyleSheet(ref.current, css);
    load().then(({ Terminal: XTerm, FitAddon }) => {
      if (disposed) return;
      const term = new XTerm({
        cursorBlink: !readOnly,
        disableStdin: readOnly,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 13,
        // Transparent, so the frame's themed surface shows through.
        allowTransparency: true,
        ...options,
        theme: { background: '#00000000', ...options?.theme },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(ref.current);
      // xterm.css gives its element no height and paints its viewport black.
      term.element.style.height = '100%';
      const viewport = term.element.querySelector('.xterm-viewport');
      if (viewport) viewport.style.backgroundColor = 'transparent';
      fit.fit();
      const detach = connect?.(term) ?? (() => {});
      const observer = new ResizeObserver(() => fit.fit());
      observer.observe(ref.current);
      cleanup = () => { observer.disconnect(); detach(); term.dispose(); };
    }).catch(error => {
      if (disposed) return;
      setFailed(true);
      onError?.(error);
    });
    return () => { disposed = true; cleanup(); };
  }, []);
  return h('div', { ...props, ref, className: cls('terminal-frame', className), 'data-failed': failed || undefined });
}
