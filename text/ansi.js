/**
 * ANSI terminal text: SGR styling (colours, bold, dim, italic, underline,
 * inverse) parsed into styled segments, every other escape sequence dropped.
 * A carriage return overwrites the line from its start, as a terminal shows
 * a progress bar, so only the text after the last one is kept.
 */

// CSI: ESC [ params final; OSC: ESC ] … (BEL | ESC \); other two-byte escapes.
const ESCAPE = /\x1b\[([0-9;:?]*)([@-~])|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]/g;

const reset = () => ({ fg: null, bg: null, bold: false, dim: false, italic: false, underline: false, inverse: false });

// The colour that 38/48 select: 5;n (256 colours) or 2;r;g;b (true colour).
function extended(codes, i) {
  if (codes[i + 1] === 5 && codes[i + 2] !== undefined) return [codes[i + 2], i + 2];
  if (codes[i + 1] === 2 && codes[i + 4] !== undefined) return [`rgb(${codes[i + 2]}, ${codes[i + 3]}, ${codes[i + 4]})`, i + 4];
  return [null, i];
}

function apply(state, params) {
  const codes = params === '' ? [0] : params.split(/[;:]/).map(n => (n === '' ? 0 : Number(n)));
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i];
    if (c === 0) Object.assign(state, reset());
    else if (c === 1) state.bold = true;
    else if (c === 2) state.dim = true;
    else if (c === 3) state.italic = true;
    else if (c === 4) state.underline = true;
    else if (c === 7) state.inverse = true;
    else if (c === 22) state.bold = state.dim = false;
    else if (c === 23) state.italic = false;
    else if (c === 24) state.underline = false;
    else if (c === 27) state.inverse = false;
    else if (c >= 30 && c <= 37) state.fg = c - 30;
    else if (c >= 90 && c <= 97) state.fg = c - 90 + 8;
    else if (c === 39) state.fg = null;
    else if (c >= 40 && c <= 47) state.bg = c - 40;
    else if (c >= 100 && c <= 107) state.bg = c - 100 + 8;
    else if (c === 49) state.bg = null;
    else if (c === 38) [state.fg, i] = extended(codes, i);
    else if (c === 48) [state.bg, i] = extended(codes, i);
  }
}

/**
 * Parses one line into `[{ text, fg, bg, bold, dim, italic, underline }]`.
 * fg and bg are null (the default), a palette index (0–255) or an rgb()
 * string; inverse is already applied. Pass the returned `state` of one line
 * as `state` to the next to carry styling across lines.
 */
export function parseAnsi(line, { state: initial } = {}) {
  const trimmed = line.replace(/\r+$/, '');
  const text = trimmed.slice(trimmed.lastIndexOf('\r') + 1);
  const state = { ...reset(), ...initial };
  const segments = [];
  let last = 0;
  const push = chunk => {
    if (!chunk) return;
    const { inverse, ...style } = state;
    const seg = inverse ? { ...style, fg: style.bg ?? 'inverse-bg', bg: style.fg ?? 'inverse-fg' } : style;
    segments.push({ text: chunk, ...seg });
  };
  for (const match of text.matchAll(ESCAPE)) {
    push(text.slice(last, match.index));
    if (match[2] === 'm' && !match[1].startsWith('?')) apply(state, match[1]);
    last = match.index + match[0].length;
  }
  push(text.slice(last));
  return Object.assign(segments, { state });
}

/** The text without any escape sequences (and carriage-return overwrites). */
export function stripAnsi(line) {
  return parseAnsi(line).map(s => s.text).join('');
}
