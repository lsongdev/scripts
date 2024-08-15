class CalendarComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._year = new Date().getFullYear();
    this._month = new Date().getMonth();
    this._locale = navigator.language;
    this._selectedDate = null;
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['year', 'month', 'locale'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this[`_${name}`] = name === 'month' ? parseInt(newValue) : newValue;
      this.render();
    }
  }

  get year() {
    return this._year;
  }

  set year(value) {
    this.setAttribute('year', value);
  }

  get month() {
    return this._month;
  }

  set month(value) {
    this.setAttribute('month', value);
  }

  get locale() {
    return this._locale;
  }

  set locale(value) {
    this.setAttribute('locale', value);
  }

  generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const monthNames = new Intl.DateTimeFormat(this._locale, { month: 'long' }).format(firstDay);
    const dayNames = [...Array(7)].map((_, i) =>
      new Intl.DateTimeFormat(this._locale, { weekday: 'short' }).format(new Date(2021, 5, i + 1))
    );

    let calendarHTML = `
        <style>
        :host {
          display: flex;
          flex-direction: column;
          font-family: Arial, sans-serif;
        }
        table {
          width: 100%;
          height: 100%;
          border-collapse: collapse;
        }
        th, td {
          cursor: pointer;
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #f2f2f2;
        }
        .today {
          background-color: #e6f3ff;
        }
        .selected {
          background-color: #ffeb3b;
        }
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .year-month-select {
          gap: 5px;
          display: flex;
          align-items: center;
        }
        </style>
        <div class="controls">
          <button id="prevMonth">&lt;</button>
          <div class="year-month-select">
            <input type="number" id="yearInput" min="1900" max="2100" value="${year}">
            <select id="monthSelect">
                ${[...Array(12)].map((_, i) => `<option value="${i}" ${i === month ? 'selected' : ''}>${new Intl.DateTimeFormat(this._locale, { month: 'long' }).format(new Date(2021, i, 1))}</option>`).join('')}
            </select>
          </div>
          <button id="today">Today</button>
          <button id="nextMonth">&gt;</button>
        </div>
        <table>
        <tr>${dayNames.map(day => `<th>${day}</th>`).join('')}</tr>`;

    let day = 1;
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      calendarHTML += '<tr>';
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startingDay) {
          calendarHTML += '<td></td>';
        } else if (day > daysInMonth) {
          calendarHTML += '<td></td>';
        } else {
          const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = date === this._selectedDate;
          calendarHTML += `<td class="${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${date}">${day}</td>`;
          day++;
        }
      }
      calendarHTML += '</tr>';
      if (day > daysInMonth) break;
    }

    calendarHTML += '</table>';
    return calendarHTML;
  }

  render() {
    this.shadowRoot.innerHTML = this.generateCalendar(this._year, this._month);
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.shadowRoot.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
    this.shadowRoot.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
    this.shadowRoot.getElementById('today').addEventListener('click', () => this.goToToday());
    this.shadowRoot.getElementById('yearInput').addEventListener('change', (e) => this.changeYear(e.target.value));
    this.shadowRoot.getElementById('monthSelect').addEventListener('change', (e) => this.changeMonth(parseInt(e.target.value) - this._month));
    this.shadowRoot.querySelectorAll('td[data-date]').forEach(cell => {
      cell.addEventListener('click', () => this.onDateClick(cell.dataset.date));
    });
  }

  changeMonth(delta) {
    let newMonth = this._month + delta;
    let newYear = this._year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    this.year = newYear;
    this.month = newMonth;
  }

  changeYear(year) {
    this.year = parseInt(year);
  }

  goToToday() {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth();
    this._selectedDate = today.toISOString().split('T')[0];
    this.render();
    this.onDateClick(this._selectedDate);
  }

  onDateClick(date) {
    if (this._selectedDate === date) {
      this._selectedDate = '';
    } else {
      this._selectedDate = date;
    }
    this.render();
    const event = new CustomEvent('dateSelected', {
      detail: this._selectedDate
    });
    this.dispatchEvent(event);
  }
}

customElements.define('x-calendar', CalendarComponent);
