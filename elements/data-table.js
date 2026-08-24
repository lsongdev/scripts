import { defineElement } from './define.js';

function normalizeColumn(column) {
  if (typeof column === 'string') return Object.freeze({ key: column, label: column });
  if (!column || typeof column.key !== 'string' || !column.key) {
    throw new TypeError('Each table column requires a non-empty key');
  }
  if (column.render !== undefined && typeof column.render !== 'function') {
    throw new TypeError('column.render must be a function');
  }
  return Object.freeze({ ...column, label: column.label ?? column.key });
}

function content(value) {
  if (value instanceof Node) return value;
  return document.createTextNode(value == null ? '' : String(value));
}

export class DataTable extends HTMLElement {
  #columns = [];
  #data = [];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:block;overflow:auto}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.5rem}';
    const table = document.createElement('table');
    table.part = 'table';
    table.append(document.createElement('thead'), document.createElement('tbody'));
    root.append(style, table);
    table.tHead.addEventListener('click', event => {
      const button = event.target.closest('button[data-column]');
      if (!button) return;
      this.dispatchEvent(new CustomEvent('columnactivate', {
        detail: { column: this.#columns[Number(button.dataset.column)] },
      }));
    });
  }

  get columns() {
    return this.#columns;
  }

  set columns(value) {
    if (!Array.isArray(value)) throw new TypeError('columns must be an array');
    this.#columns = Object.freeze(value.map(normalizeColumn));
    this.render();
  }

  get data() {
    return this.#data;
  }

  set data(value) {
    if (!Array.isArray(value)) throw new TypeError('data must be an array');
    this.#data = Object.freeze([...value]);
    this.render();
  }

  render() {
    const headRow = document.createElement('tr');
    this.#columns.forEach((column, index) => {
      const heading = document.createElement('th');
      heading.scope = 'col';
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.column = String(index);
      button.append(content(column.label));
      heading.append(button);
      headRow.append(heading);
    });
    this.shadowRoot.querySelector('thead').replaceChildren(headRow);

    const rows = this.#data.map((row, rowIndex) => {
      const tableRow = document.createElement('tr');
      this.#columns.forEach(column => {
        const cell = document.createElement('td');
        const value = column.render
          ? column.render(row[column.key], row, rowIndex)
          : row[column.key];
        cell.append(content(value));
        tableRow.append(cell);
      });
      return tableRow;
    });
    this.shadowRoot.querySelector('tbody').replaceChildren(...rows);
    return this;
  }
}

export const defineDataTable = registry =>
  defineElement('data-table', DataTable, undefined, registry);
