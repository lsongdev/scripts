import { difference, formatDate, formatDuration, parseDate } from '../datetime/format.js';
import { defineElement } from './define.js';

export class XTime extends HTMLElement {
  static observedAttributes = ['datetime', 'format', 'relative', 'timezone', 'update-interval'];
  #initialText;
  #timer;

  connectedCallback() {
    this.#initialText ??= this.textContent.trim();
    this.render();
    this.#schedule();
  }

  disconnectedCallback() {
    this.#clearTimer();
  }

  attributeChangedCallback() {
    if (!this.isConnected) return;
    this.render();
    this.#schedule();
  }

  get datetime() {
    return this.getAttribute('datetime');
  }

  set datetime(value) {
    if (value == null) this.removeAttribute('datetime');
    else this.setAttribute('datetime', value);
  }

  get format() {
    return this.getAttribute('format');
  }

  set format(value) {
    if (value == null) this.removeAttribute('format');
    else this.setAttribute('format', value);
  }

  get timezone() {
    return this.getAttribute('timezone');
  }

  set timezone(value) {
    if (value == null) this.removeAttribute('timezone');
    else this.setAttribute('timezone', value);
  }

  get date() {
    const value = this.getAttribute('datetime') || this.#initialText;
    return value ? parseDate(value) : new Date();
  }

  render(reference = new Date()) {
    const date = this.date;
    this.textContent = this.hasAttribute('relative')
      ? formatDuration(difference(date, reference))
      : formatDate(date, this.getAttribute('format') || '{datetime}', {
        timeZone: this.getAttribute('timezone') || undefined,
      });
    return this.textContent;
  }

  #clearTimer() {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  #schedule() {
    this.#clearTimer();
    const interval = Number(this.getAttribute('update-interval') || 0);
    if (!Number.isFinite(interval) || interval < 0) {
      throw new RangeError('update-interval must be finite and non-negative');
    }
    if (!interval) return;
    this.#timer = setTimeout(() => {
      this.render();
      this.#schedule();
    }, interval);
  }
}

export const defineTime = registry => defineElement('x-time', XTime, undefined, registry);
