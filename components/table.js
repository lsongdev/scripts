
export class XTable extends HTMLTableElement {
  constructor() {
    super();
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
    this.thead.addEventListener('click', (e) => {
      const { nodeName, column } = e.target;
      if (nodeName !== 'TH') return;
      console.log(column.name);
    })
  }
  renders = {
    text(value) {
      return document.createTextNode(value);
    },
    button(value) {
      const button = document.createElement('button');
      button.textContent = value;
      return button;
    },
    input(value) {
      const input = document.createElement('input');
      input.value = value;
      return input;
    }
  };
  set columns(columns) {
    this._columns = columns;
    this.renderColumns();
  }
  set data(rows) {
    this._rows = rows;
    this.renderRows();
  }
  renderColumns() {
    for (const column of this._columns) {
      const th = document.createElement('th');
      th.textContent = column.label || column.name;
      th.column = column;
      this.thead.appendChild(th);
    }
  }
  renderRows(rows) {
    const getRender = render => {
      if (typeof render === 'string')
        return this.renders[render];
      if (typeof render === 'function')
        return render;
      return this.renders.text;
    };
    for (const row of this._rows) {
      const tr = document.createElement('tr');
      for (const column of this._columns) {
        const td = document.createElement('td');
        const field = column.name in row ?
          row[column.name] : column.default;
        const render = getRender(column.render);
        if (!render) {
          throw new Error(`unknown render ${column.render}`);
        }
        td.appendChild(render(field, column, row));
        tr.appendChild(td);
      }
      this.tbody.appendChild(tr);
    }
  }
}

customElements.define('x-table', XTable, { extends: 'table' });
