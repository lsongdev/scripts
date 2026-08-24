import { defineElement } from './define.js';

const DAY = 86_400_000;
const dateKey = date => date.toISOString().slice(0, 10);
const utcDate = (year, month, day) => {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
};

function shiftMonth(date, delta) {
  const target = utcDate(date.getUTCFullYear(), date.getUTCMonth() + 1 + delta, 1);
  const lastDay = utcDate(target.getUTCFullYear(), target.getUTCMonth() + 2, 0).getUTCDate();
  return utcDate(target.getUTCFullYear(), target.getUTCMonth() + 1,
    Math.min(date.getUTCDate(), lastDay));
}

function shiftYear(date, delta) {
  const targetYear = date.getUTCFullYear() + delta;
  const month = date.getUTCMonth() + 1;
  const lastDay = utcDate(targetYear, month + 1, 0).getUTCDate();
  return utcDate(targetYear, month, Math.min(date.getUTCDate(), lastDay));
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) throw new TypeError('value must use YYYY-MM-DD');
  const date = utcDate(Number(match[1]), Number(match[2]), Number(match[3]));
  if (dateKey(date) !== value) throw new TypeError('value must be a valid calendar date');
  return date;
}

function integerAttribute(element, name, fallback, minimum, maximum) {
  if (!element.hasAttribute(name)) return fallback;
  const value = Number(element.getAttribute(name));
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

export class DateCalendar extends HTMLElement {
  static observedAttributes = ['year', 'month', 'locale', 'week-start', 'value'];

  #active;
  #rendered = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:block}.controls{display:flex;align-items:center;justify-content:space-between}table{border-collapse:collapse;width:100%}th,td{text-align:center}button[data-date]{width:100%}[aria-pressed="true"]{font-weight:bold;outline:2px solid currentColor}.outside{opacity:.55}';
    const controls = document.createElement('div');
    controls.className = 'controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.dataset.action = 'previous';
    previous.setAttribute('aria-label', 'Previous month');
    previous.textContent = '‹';
    const heading = document.createElement('span');
    heading.id = 'heading';
    heading.setAttribute('aria-live', 'polite');
    const next = document.createElement('button');
    next.type = 'button';
    next.dataset.action = 'next';
    next.setAttribute('aria-label', 'Next month');
    next.textContent = '›';
    controls.append(previous, heading, next);
    const table = document.createElement('table');
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-labelledby', 'heading');
    table.append(document.createElement('thead'), document.createElement('tbody'));
    root.append(style, controls, table);
    root.addEventListener('click', event => this.#click(event));
    root.addEventListener('keydown', event => this.#keydown(event));
  }

  connectedCallback() { this.render(); }
  attributeChangedCallback() { if (this.isConnected) this.render(); }

  get value() { return this.getAttribute('value') ?? ''; }
  set value(value) {
    if (value === '' || value == null) this.removeAttribute('value');
    else { parseDateKey(String(value)); this.setAttribute('value', String(value)); }
  }

  get year() { return integerAttribute(this, 'year', new Date().getFullYear(), 1, 9999); }
  set year(value) { this.setAttribute('year', String(value)); }
  get month() { return integerAttribute(this, 'month', new Date().getMonth() + 1, 1, 12); }
  set month(value) { this.setAttribute('month', String(value)); }
  get weekStart() { return integerAttribute(this, 'week-start', 0, 0, 6); }
  set weekStart(value) { this.setAttribute('week-start', String(value)); }
  get locale() { return this.getAttribute('locale') || navigator.language; }
  set locale(value) { this.setAttribute('locale', value); }

  showMonth(year, month, { focus = false } = {}) {
    const date = utcDate(year, month, 1);
    this.setAttribute('year', String(date.getUTCFullYear()));
    this.setAttribute('month', String(date.getUTCMonth() + 1));
    this.#active = date;
    this.render({ focus });
  }

  render({ focus = false } = {}) {
    const year = this.year;
    const month = this.month;
    const selected = this.value ? parseDateKey(this.value) : undefined;
    if (!this.#active || this.#active.getUTCFullYear() !== year
      || this.#active.getUTCMonth() + 1 !== month) {
      this.#active = selected?.getUTCFullYear() === year && selected.getUTCMonth() + 1 === month
        ? selected
        : utcDate(year, month, 1);
    }
    const locale = this.locale;
    this.shadowRoot.querySelector('#heading').textContent = new Intl.DateTimeFormat(locale, {
      month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(utcDate(year, month, 1));

    const headRow = document.createElement('tr');
    for (let index = 0; index < 7; index += 1) {
      const weekday = (this.weekStart + index) % 7;
      const anchor = utcDate(2024, 1, 7 + weekday);
      const heading = document.createElement('th');
      heading.scope = 'col';
      heading.textContent = new Intl.DateTimeFormat(locale, {
        weekday: 'short', timeZone: 'UTC',
      }).format(anchor);
      headRow.append(heading);
    }
    this.shadowRoot.querySelector('thead').replaceChildren(headRow);

    const first = utcDate(year, month, 1);
    const offset = (first.getUTCDay() - this.weekStart + 7) % 7;
    const start = new Date(first.getTime() - offset * DAY);
    const rows = [];
    for (let week = 0; week < 6; week += 1) {
      const row = document.createElement('tr');
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(start.getTime() + (week * 7 + day) * DAY);
        const key = dateKey(date);
        const cell = document.createElement('td');
        cell.setAttribute('role', 'gridcell');
        if (date.getUTCMonth() + 1 !== month) cell.className = 'outside';
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.date = key;
        button.textContent = String(date.getUTCDate());
        button.tabIndex = key === dateKey(this.#active) ? 0 : -1;
        button.setAttribute('aria-label', new Intl.DateTimeFormat(locale, {
          dateStyle: 'full', timeZone: 'UTC',
        }).format(date));
        button.setAttribute('aria-pressed', String(key === this.value));
        cell.append(button);
        row.append(cell);
      }
      rows.push(row);
    }
    this.shadowRoot.querySelector('tbody').replaceChildren(...rows);
    this.#rendered = true;
    if (focus) this.shadowRoot.querySelector(`[data-date="${dateKey(this.#active)}"]`)?.focus();
    return this;
  }

  #click(event) {
    const action = event.target.closest('button')?.dataset.action;
    if (action) {
      this.showMonth(this.year, this.month + (action === 'next' ? 1 : -1), { focus: false });
      return;
    }
    const key = event.target.closest('button[data-date]')?.dataset.date;
    if (key) this.#select(parseDateKey(key));
  }

  #keydown(event) {
    if (!event.target.matches('button[data-date]')) return;
    const date = parseDateKey(event.target.dataset.date);
    let next;
    if (event.key === 'ArrowLeft') next = new Date(date.getTime() - DAY);
    if (event.key === 'ArrowRight') next = new Date(date.getTime() + DAY);
    if (event.key === 'ArrowUp') next = new Date(date.getTime() - 7 * DAY);
    if (event.key === 'ArrowDown') next = new Date(date.getTime() + 7 * DAY);
    if (event.key === 'Home') next = new Date(date.getTime() - ((date.getUTCDay() - this.weekStart + 7) % 7) * DAY);
    if (event.key === 'End') next = new Date(date.getTime() + (6 - ((date.getUTCDay() - this.weekStart + 7) % 7)) * DAY);
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      next = event.shiftKey
        ? shiftYear(date, event.key === 'PageUp' ? -1 : 1)
        : shiftMonth(date, event.key === 'PageUp' ? -1 : 1);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.#select(date);
      return;
    }
    if (!next) return;
    event.preventDefault();
    this.#active = next;
    const outside = next.getUTCFullYear() !== this.year || next.getUTCMonth() + 1 !== this.month;
    if (outside) this.showMonth(next.getUTCFullYear(), next.getUTCMonth() + 1, { focus: true });
    else this.render({ focus: true });
  }

  #select(date) {
    this.#active = date;
    this.value = dateKey(date);
    if (date.getUTCFullYear() !== this.year || date.getUTCMonth() + 1 !== this.month) {
      this.showMonth(date.getUTCFullYear(), date.getUTCMonth() + 1, { focus: true });
    } else if (this.#rendered) this.render({ focus: true });
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export const defineDateCalendar = registry =>
  defineElement('date-calendar', DateCalendar, undefined, registry);
