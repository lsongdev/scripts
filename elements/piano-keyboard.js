import { defineElement } from './define.js';
import { noteToFrequency } from '../media/audio.js';

const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiNote = midi => `${PITCHES[midi % 12]}${Math.floor(midi / 12) - 1}`;

function midiAttribute(element, name, fallback) {
  if (!element.hasAttribute(name)) return fallback;
  const value = Number(element.getAttribute(name));
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`${name} must be a MIDI integer from 0 to 127`);
  }
  return value;
}

export class PianoKeyboard extends HTMLElement {
  static observedAttributes = ['end', 'show-notes', 'start'];
  #active = new Set();

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:flex;min-height:8rem}.key{background:white;border:1px solid black;color:black;flex:1;min-width:1.5rem}.key.black{background:black;color:white;margin:0 -.5rem;z-index:1}.key[aria-pressed="true"]{background:Highlight;color:HighlightText}';
    const keys = document.createElement('div');
    keys.part = 'keys';
    keys.style.display = 'contents';
    root.append(style, keys);
    root.addEventListener('pointerdown', event => this.#pointerDown(event));
    root.addEventListener('pointerup', event => this.#pointerEnd(event));
    root.addEventListener('pointercancel', event => this.#pointerEnd(event));
    root.addEventListener('lostpointercapture', event => this.#pointerEnd(event));
    root.addEventListener('keydown', event => this.#keyDown(event));
    root.addEventListener('keyup', event => this.#keyUp(event));
  }

  connectedCallback() { this.render(); }
  disconnectedCallback() { for (const midi of [...this.#active]) this.#setActive(midi, false, 'disconnect'); }
  attributeChangedCallback() { if (this.isConnected) this.render(); }
  get start() { return midiAttribute(this, 'start', 48); }
  set start(value) { this.setAttribute('start', String(value)); }
  get end() { return midiAttribute(this, 'end', 72); }
  set end(value) { this.setAttribute('end', String(value)); }

  render() {
    if (this.end < this.start) throw new RangeError('end must be greater than or equal to start');
    const keys = [];
    for (let midi = this.start; midi <= this.end; midi += 1) {
      const note = midiNote(midi);
      const key = document.createElement('button');
      key.type = 'button';
      key.className = `key${note.includes('#') ? ' black' : ''}`;
      key.dataset.midi = String(midi);
      key.setAttribute('aria-label', note);
      key.setAttribute('aria-pressed', String(this.#active.has(midi)));
      key.textContent = this.hasAttribute('show-notes') ? note : '';
      keys.push(key);
    }
    this.shadowRoot.querySelector('[part="keys"]').replaceChildren(...keys);
    return this;
  }

  setActive(noteOrMidi, active, source = 'programmatic') {
    const midi = typeof noteOrMidi === 'number'
      ? noteOrMidi
      : [...this.shadowRoot.querySelectorAll('[data-midi]')]
        .find(key => key.getAttribute('aria-label') === noteOrMidi)?.dataset.midi;
    if (midi === undefined) throw new RangeError(`Unknown keyboard note: ${noteOrMidi}`);
    this.#setActive(Number(midi), Boolean(active), source);
  }

  #setActive(midi, active, source) {
    if (this.#active.has(midi) === active) return;
    if (active) this.#active.add(midi); else this.#active.delete(midi);
    const key = this.shadowRoot.querySelector(`[data-midi="${midi}"]`);
    key?.setAttribute('aria-pressed', String(active));
    const note = midiNote(midi);
    this.dispatchEvent(new CustomEvent(active ? 'notestart' : 'noteend', {
      bubbles: true,
      composed: true,
      detail: { frequency: noteToFrequency(note), midi, note, source },
    }));
  }

  #pointerDown(event) {
    const key = event.target.closest('button[data-midi]');
    if (!key) return;
    key.setPointerCapture(event.pointerId);
    this.#setActive(Number(key.dataset.midi), true, 'pointer');
  }
  #pointerEnd(event) {
    const key = event.target.closest('button[data-midi]');
    if (key) this.#setActive(Number(key.dataset.midi), false, 'pointer');
  }
  #keyDown(event) {
    if (event.repeat || ![' ', 'Enter'].includes(event.key)) return;
    const key = event.target.closest('button[data-midi]');
    if (!key) return;
    event.preventDefault();
    this.#setActive(Number(key.dataset.midi), true, 'keyboard');
  }
  #keyUp(event) {
    if (![' ', 'Enter'].includes(event.key)) return;
    const key = event.target.closest('button[data-midi]');
    if (!key) return;
    event.preventDefault();
    this.#setActive(Number(key.dataset.midi), false, 'keyboard');
  }
}

export const definePianoKeyboard = registry =>
  defineElement('piano-keyboard', PianoKeyboard, undefined, registry);
