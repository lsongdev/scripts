function delimiterCharacter(value) {
  if (typeof value !== 'string' || [...value].length !== 1 || /["\r\n]/.test(value)) {
    throw new TypeError('delimiter must be one non-quote, non-newline character');
  }
  return value;
}

/** Parse strict RFC 4180-style CSV into rows of strings. */
export function parseCSV(source, { delimiter = ',' } = {}) {
  delimiter = delimiterCharacter(delimiter);
  if (typeof source !== 'string') throw new TypeError('CSV source must be a string');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;

  const pushField = () => {
    row.push(field);
    field = '';
    closedQuote = false;
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (closedQuote && character !== delimiter && character !== '\r' && character !== '\n') {
      throw new SyntaxError('Unexpected character after closing CSV quote');
    }
    if (character === '"') {
      if (field || closedQuote) throw new SyntaxError('CSV quote must begin an empty field');
      quoted = true;
    } else if (character === delimiter) {
      pushField();
    } else if (character === '\r' || character === '\n') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      pushRow();
    } else {
      field += character;
    }
  }
  if (quoted) throw new SyntaxError('Unterminated quoted CSV field');
  if (field || row.length || closedQuote) pushRow();
  return rows;
}

/** Serialize rows with RFC 4180 quoting and CRLF by default. */
export function stringifyCSV(rows, {
  delimiter = ',',
  lineEnding = '\r\n',
} = {}) {
  delimiter = delimiterCharacter(delimiter);
  if (!['\n', '\r\n'].includes(lineEnding)) {
    throw new TypeError('lineEnding must be LF or CRLF');
  }
  const encode = value => {
    const field = value == null ? '' : String(value);
    return field.includes(delimiter) || /["\r\n]/.test(field)
      ? `"${field.replaceAll('"', '""')}"`
      : field;
  };
  return [...rows].map(row => [...row].map(encode).join(delimiter)).join(lineEnding);
}
