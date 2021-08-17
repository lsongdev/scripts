import { define, wrap } from '../webcomponent.js';

define('x-table', class extends wrap('table') {
  connectedCallback() {
    this.init();
  }
  renders = {
    button: function (val) {
      var btn = document.createElement('button');
      btn.innerText = val;
      return btn;
    },
    input: function (val) {
      var input = document.createElement('input');
      input.value = val;
      return input;
    }
  }
  set columns(columns) {
    this._columns = columns;
    this.renderHeader(columns);
  }
  set items(items) {
    this._items = items;
    this.renderRows(items);
  }
  init() {
    this.thead = this.querySelector('thead');
    if (!this.thead) {
      this.thead = document.createElement('thead');
      this.appendChild(this.thead);
    }
    this.tbody = this.querySelector('tbody');
    if (!this.tbody) {
      this.tbody = document.createElement('tbody');
      this.appendChild(this.tbody);
    }
  }
  renderHeader(columns) {
    const tr = document.createElement('tr');
    for (var index in columns) {
      var field = columns[index];
      var th = document.createElement('th');
      th.innerText = field.label || field.name;
      tr.appendChild(th);
    }
    this.thead.appendChild(tr);
  }
  renderColumns(tr, item) {
    for (const index in this._columns) {
      const column = this._columns[index];
      const value = item[column.name];
      var render = column.render;
      if (typeof render == 'string') {
        render = this.renders[render];
      }
      if (!render) {
        render = this.renders[typeof value];
      }
      if (!render) {
        render = function (value) {
          return document.createTextNode(value);
        }
      }
      var td = document.createElement('td');
      td.data = value;
      td.className = column.className || '';
      td.appendChild(render.call(item, value || column.default || ''));
      tr.appendChild(td);
    }
  }
  renderRows(items) {
    for (const item of items) {
      const tr = document.createElement('tr');
      this.renderColumns(tr, item);
      this.tbody.appendChild(tr);
    }
  }
  clear() {
    this.thead.innerHTML = '';
    this.tbody.innerHTML = '';
    this.tfoot.innerHTML = '';
  }
}, { extends: 'table' });
