import { format, parse } from '../time.js';
import { define, wrap } from '../dom/webcomponent.js';

const DEFAULT_FORMAT = '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}';
const DEFAULT_UPDATE_INTERVAL = 1000; // 1 second

define('x-time', class extends wrap('time') {
  static get observedAttributes() {
    return ['format', 'datetime', 'timezone', 'update-interval'];
  }

  #updateTimer = null;
  #format = DEFAULT_FORMAT;
  #datetime = new Date();
  #timezone = 'UTC';
  #updateInterval = DEFAULT_UPDATE_INTERVAL;

  constructor() {
    super();
    this.updateDisplay = this.updateDisplay.bind(this);
  }

  connectedCallback() {
    this.mount();
    this.startUpdating();
  }

  disconnectedCallback() {
    this.stopUpdating();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    const handlers = {
      format: () => this.#format = newValue || DEFAULT_FORMAT,
      datetime: () => this.#datetime = newValue ? parse(newValue) : new Date(),
      timezone: () => this.#timezone = newValue || 'UTC',
      'update-interval': () => {
        this.#updateInterval = parseInt(newValue, 10) || DEFAULT_UPDATE_INTERVAL;
        this.restartUpdating();
      }
    };

    handlers[name]?.();
    this.updateDisplay();
  }

  mount() {
    this.#format = this.getAttribute('format') || DEFAULT_FORMAT;
    this.#datetime = this.getAttribute('datetime') ? parse(this.getAttribute('datetime')) : new Date();
    this.#timezone = this.getAttribute('timezone') || 'UTC';
    this.#updateInterval = parseInt(this.getAttribute('update-interval'), 10) || DEFAULT_UPDATE_INTERVAL;
    this.updateDisplay();
  }

  updateDisplay() {
    this.textContent = format(this.#format, this.#datetime, this.#timezone);
  }

  startUpdating() {
    this.stopUpdating();
    this.#updateTimer = setInterval(() => {
      if (!this.hasAttribute('datetime')) {
        this.#datetime = new Date();
      }
      this.updateDisplay();
    }, this.#updateInterval);
  }

  stopUpdating() {
    if (this.#updateTimer) {
      clearInterval(this.#updateTimer);
      this.#updateTimer = null;
    }
  }

  restartUpdating() {
    this.stopUpdating();
    this.startUpdating();
  }
}, { extends: 'time' });
