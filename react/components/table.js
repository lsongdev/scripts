import { h, useState } from '../react.js';
import { cls } from '../../dom/stylesheets.js';
import { Pagination } from './pagination.js';

/**
 * A table that scrolls sideways on narrow screens instead of wrapping its
 * cells; framed (the default) draws a border for a table standing on its
 * own, and false suits one inside a card. table.css.
 *
 * Give it `columns` and `rows` to have it render the header and body:
 *
 *   columns: [{ key, title, render(row, index), align, grow, width, className, sort }]
 *
 * A cell shows `render(row, index)`, or `row[key]` without render. `align`
 * ("start", "center", "end") aligns the header and cells; `grow` lets the
 * column take the free width and wrap (cells otherwise stay on one line);
 * `width` fixes a column's width (any CSS length); `className` goes on both. `sort` makes the column sortable from its header: true compares
 * `row[key]` (numbers numerically, text in the user's locale, empty values
 * last), or pass a compare(a, b) function of rows. Sorting is the table's
 * own state, starting from `defaultSort` ({ key, direction: "asc" | "desc" }),
 * unless `sort` and `onSort` control it.
 *
 * `rowKey` names the field (or is a function of the row) that keys rows;
 * `rowProps(row, index)` adds attributes to a row, such as a class or a
 * click handler. With no rows, `empty` shows in a single cell.
 *
 * `pageSize` shows that many rows at a time, with a Pagination below them;
 * `pagination` passes it props such as `jump` or `labels`. Sorting returns
 * to the first page. Rows paged by a server instead are shown as given, with
 * your own Pagination in `footer`, which renders below the rows inside the
 * frame.
 *
 * Without columns, children are the table's sections and rows.
 */
export function Table({
  columns, rows = [], rowKey, rowProps, empty, caption,
  sort: controlled, defaultSort = null, onSort,
  pageSize, pagination, footer,
  framed = true, className = '', children, ...props
}) {
  const [own, setOwn] = useState(defaultSort);
  const [wanted, setPage] = useState(1);
  const sort = controlled !== undefined ? controlled : own;
  let shown = columns ? sorted(rows, columns, sort) : rows;
  let pager = null;
  if (columns && pageSize > 0) {
    const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
    const page = Math.min(wanted, pageCount); // the rows may have shrunk
    shown = shown.slice((page - 1) * pageSize, page * pageSize);
    if (pageCount > 1) pager = h(Pagination, { ...pagination, page, pageCount, onChange: setPage });
  }
  const content = columns
    ? [
      caption != null && h('caption', { key: 'caption' }, caption),
      h('thead', { key: 'head' }, h('tr', null, columns.map(column => header(column, sort, next => {
        if (controlled === undefined) setOwn(next);
        setPage(1);
        onSort?.(next);
      })))),
      h('tbody', { key: 'body' }, body(columns, shown, rowKey, rowProps, empty)),
    ]
    : children;
  const table = h('table', { ...props, className: cls('table', className) }, content);
  if (footer == null && !pager) {
    return h('div', { className: cls('table-scroll', framed && 'table-framed') }, table);
  }
  // The footer stays put while a wide table scrolls sideways above it.
  return h('div', { className: cls(framed && 'table-framed') },
    h('div', { className: 'table-scroll' }, table),
    h('div', { className: 'table-footer' }, footer, pager));
}

const aligns = { start: 'start', center: 'center', end: 'end', left: 'left', right: 'right' };

function cellProps(column) {
  const style = {};
  if (column.align) style.textAlign = aligns[column.align] || column.align;
  if (column.width != null) style.width = typeof column.width === 'number' ? `${column.width}px` : column.width;
  return {
    className: cls(column.grow && 'table-grow', column.className) || undefined,
    style: Object.keys(style).length ? style : undefined,
  };
}

function header(column, sort, setSort) {
  const props = { key: column.key, scope: 'col', ...cellProps(column) };
  if (!column.sort) return h('th', props, column.title);
  const direction = sort?.key === column.key ? sort.direction : null;
  const next = { key: column.key, direction: direction === 'asc' ? 'desc' : 'asc' };
  return h('th', { ...props, 'aria-sort': direction ? (direction === 'asc' ? 'ascending' : 'descending') : 'none' },
    h('button', { type: 'button', className: 'table-sort', onClick: () => setSort(next) },
      column.title,
      h('span', { className: 'table-sort-indicator', 'aria-hidden': 'true' },
        direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '')));
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const blank = value => value === undefined || value === null || value === '';

function compareValues(a, b) {
  if (blank(a) || blank(b)) return blank(a) - blank(b); // empty values last
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a - b;
  return collator.compare(String(a), String(b));
}

function sorted(rows, columns, sort) {
  const column = sort && columns.find(c => c.key === sort.key && c.sort);
  if (!column) return rows;
  const compare = typeof column.sort === 'function'
    ? column.sort
    : (a, b) => compareValues(a[column.key], b[column.key]);
  const sign = sort.direction === 'desc' ? -1 : 1;
  return rows.map((row, index) => ({ row, index }))
    .sort((a, b) => sign * compare(a.row, b.row) || a.index - b.index)
    .map(({ row }) => row);
}

function body(columns, rows, rowKey, rowProps, empty) {
  if (!rows.length) {
    return empty == null ? null
      : h('tr', { className: 'table-empty-row' }, h('td', { className: 'table-empty', colSpan: columns.length }, empty));
  }
  return rows.map((row, index) => {
    const key = typeof rowKey === 'function' ? rowKey(row, index) : rowKey != null ? row[rowKey] : index;
    return h('tr', { key, ...rowProps?.(row, index) }, columns.map(column =>
      h('td', { key: column.key, ...cellProps(column) },
        column.render ? column.render(row, index) : row[column.key])));
  });
}
