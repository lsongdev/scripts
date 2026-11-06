import { useEffect, useRef, useState } from '../react.js';

/**
 * Follow a server-sent event stream for as long as the component is mounted
 * and `url` stays the same; a null url opens nothing. `onMessage` receives
 * unnamed events and `events` maps event names to handlers; each gets the
 * MessageEvent. The latest handlers are always used, so they need not be
 * stable. Returns whether the stream is open: EventSource reconnects on its
 * own (resuming with Last-Event-ID), and this turns false while it does or
 * once it gives up.
 */
export function useEventSource(url, { onMessage, events = {}, withCredentials = false } = {}) {
  const [open, setOpen] = useState(false);
  const handlers = useRef({ onMessage, events });
  handlers.current = { onMessage, events };
  const names = Object.keys(events).sort().join('\n');

  useEffect(() => {
    if (url == null) return undefined;
    const source = new EventSource(url, { withCredentials });
    source.onopen = () => setOpen(true);
    source.onerror = () => setOpen(source.readyState === EventSource.OPEN);
    source.onmessage = event => handlers.current.onMessage?.(event);
    for (const name of names ? names.split('\n') : []) {
      source.addEventListener(name, event => handlers.current.events[name]?.(event));
    }
    return () => { source.close(); setOpen(false); };
  }, [String(url), withCredentials, names]);

  return open;
}
