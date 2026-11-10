import { useEffect, useState } from '../react.js';

/*
 * Log lines from a live source, for LogView. A source is `{ key, open(sink) }`:
 * open attaches to the transport and returns a function that detaches; key
 * says when two sources are the same, so re-rendering with an equal source
 * keeps the connection. The sink takes `push(lines)`, `open()`, `retrying()`,
 * `end()` and `fail(error)`.
 *
 * Each source takes `parse(text)`, turning a message (SSE) or a line (the
 * byte streams) into a line, an array of lines or null to skip it; lines are
 * what LogView takes: strings or { text, stream, … }. The default keeps the
 * text as it is.
 */

const asList = value => (value == null ? [] : Array.isArray(value) ? value : [value]);

// Splits a stream of text chunks into lines, holding back a partial last one.
function lineSplitter(parse, push) {
  let rest = '';
  return {
    write(chunk) {
      const parts = (rest + chunk).split('\n');
      rest = parts.pop();
      push(parts.flatMap(text => asList(parse(text.replace(/\r$/, '')))));
    },
    flush() {
      if (rest) push(asList(parse(rest)));
      rest = '';
    },
  };
}

/**
 * Server-sent events: each `event` message is parsed into lines. endEvent
 * names a message that ends the stream; errorEvent one whose data reports a
 * failure (parsed with parseError, by default `{ message }` JSON). Transport
 * errors are retried by EventSource, then reported once it gives up.
 */
export function sseLines(url, {
  event = 'message', parse = text => text, endEvent, errorEvent,
  parseError = text => new Error(JSON.parse(text).message), withCredentials = false,
} = {}) {
  return {
    key: ['sse', url, event, endEvent, errorEvent].join(' '),
    open(sink) {
      const source = new EventSource(url, { withCredentials });
      source.onopen = () => sink.open();
      source.addEventListener(event, e => {
        try {
          sink.push(asList(parse(e.data)));
        } catch (err) {
          source.close();
          sink.fail(err);
        }
      });
      if (endEvent) source.addEventListener(endEvent, () => { source.close(); sink.end(); });
      // A server's "error" message and a transport error share the event
      // type; only the message carries data.
      source.addEventListener('error', e => {
        if (errorEvent === 'error' && e.data != null) { source.close(); sink.fail(parseError(e.data)); return; }
        if (source.readyState === EventSource.CLOSED) sink.fail(new Error('The stream closed'));
        else sink.retrying();
      });
      if (errorEvent && errorEvent !== 'error') {
        source.addEventListener(errorEvent, e => { source.close(); sink.fail(parseError(e.data)); });
      }
      return () => source.close();
    },
  };
}

/** A WebSocket whose messages (text or bytes) are a stream of lines. */
export function webSocketLines(url, { parse = text => text, protocols } = {}) {
  return {
    key: ['ws', url].join(' '),
    open(sink) {
      const ws = new WebSocket(url, protocols);
      ws.binaryType = 'arraybuffer';
      const decoder = new TextDecoder();
      const lines = lineSplitter(parse, list => sink.push(list));
      ws.onopen = () => sink.open();
      ws.onmessage = e => {
        try {
          lines.write(typeof e.data === 'string' ? e.data : decoder.decode(e.data, { stream: true }));
        } catch (err) {
          ws.onclose = null;
          ws.close();
          sink.fail(err);
        }
      };
      ws.onclose = e => {
        lines.flush();
        if (e.wasClean || e.code === 1000) sink.end();
        else sink.fail(new Error(e.reason || 'The connection closed'));
      };
      return () => { ws.onclose = null; ws.close(); };
    },
  };
}

/** A streamed HTTP response body (text, or NDJSON with a parse), read as it arrives. */
export function fetchLines(url, { parse = text => text, init } = {}) {
  return {
    key: ['fetch', url, init?.method ?? 'GET'].join(' '),
    open(sink) {
      const controller = new AbortController();
      (async () => {
        const response = await fetch(url, { ...init, signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        sink.open();
        const lines = lineSplitter(parse, list => sink.push(list));
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          lines.write(value);
        }
        lines.flush();
        sink.end();
      })().catch(error => { if (error.name !== 'AbortError') sink.fail(error); });
      return () => controller.abort();
    },
  };
}

/**
 * Follows a line source while mounted and while its key stays the same; a
 * null source opens nothing. Lines arriving together render once per frame,
 * and only the newest `max` are kept. Returns `{ lines, status, error,
 * clear }`; status is idle, connecting, open, retrying, ended or failed.
 */
export function useLineStream(source, { max = 5000 } = {}) {
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState(source ? 'connecting' : 'idle');
  const [error, setError] = useState(null);
  const key = source?.key ?? null;
  useEffect(() => {
    setLines([]);
    setError(null);
    if (!source) { setStatus('idle'); return undefined; }
    setStatus('connecting');
    let pending = [];
    let frame = 0;
    let live = true;
    const flush = () => {
      frame = 0;
      if (!live || !pending.length) return;
      const batch = pending;
      pending = [];
      setLines(prev => {
        const next = prev.concat(batch);
        return next.length > max ? next.slice(next.length - max) : next;
      });
    };
    const sink = {
      push(list) {
        if (!live || !list.length) return;
        pending.push(...list);
        frame ||= requestAnimationFrame(flush);
      },
      open: () => live && setStatus('open'),
      retrying: () => live && setStatus('retrying'),
      end() { flush(); if (live) setStatus('ended'); },
      fail(err) { flush(); if (live) { setError(err); setStatus('failed'); } },
    };
    let detach;
    try {
      detach = source.open(sink);
    } catch (err) {
      sink.fail(err);
    }
    return () => { live = false; cancelAnimationFrame(frame); detach?.(); };
  }, [key, max]);
  return { lines, status, error, clear: () => setLines([]) };
}
