import { format, parse, diff, formatDiff } from '../time.js';
import { define, wrap } from '../dom/webcomponent.js';

const DEFAULT_FORMAT = '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}';

define('x-time', class extends wrap('time') {
  static get observedAttributes() { return ['format', 'datetime', 'timezone', 'update-interval', 'diff']; }

  #timer = null;
  #format = DEFAULT_FORMAT;
  #datetime = null;
  #timezone = null;
  #interval = 0;
  #diff = false;
  #mounted = false;

  connectedCallback() { this.mount(); }
  disconnectedCallback() { this.stop(); }

  attributeChangedCallback(name, old, val) {
    if (old === val) return;
    const h = {
      format: () => this.#format = val || DEFAULT_FORMAT,
      datetime: () => this.#datetime = val ? parse(val) : null,
      timezone: () => this.#timezone = val || null,
      'update-interval': () => { this.#interval = parseInt(val, 10) || 0; this.restart(); },
      diff: () => this.#diff = val !== null,
    };
    h[name]?.();
    if (this.#mounted) this.render();
  }

  mount() {
    const a = this.attributes;
    this.#format = a.format?.value || DEFAULT_FORMAT;
    this.#timezone = a.timezone?.value || null;
    this.#interval = parseInt(a.getNamedItem('update-interval')?.value, 10) || 0;
    this.#diff = a.diff?.name === 'diff';

    if (a.datetime?.value) {
      this.#datetime = parse(a.datetime.value);
    } else if (this.textContent?.trim()) {
      this.#datetime = parse(this.textContent);
    } else {
      this.#datetime = new Date();
    }

    this.#mounted = true;
    this.render();
    this.restart();
  }

  render() {
    const now = new Date();
    const target = this.#datetime || now;
    const tz = this.#timezone;

    if (this.#diff) {
      const d = diff(target, now, tz);
      this.textContent = formatDiff(d);
    } else {
      this.textContent = format(target, this.#format, tz);
    }
  }

  start() {
    if (this.#interval > 0) {
      this.#timer = setInterval(() => this.render(), this.#interval);
    }
  }

  stop() {
    if (this.#timer) { clearInterval(this.#timer); this.#timer = null; }
  }

  restart() { this.stop(); this.start(); }
}, { extends: 'time' });