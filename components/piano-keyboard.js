export class PianoKeyboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.showNotes = false;
  }

  static get observedAttributes() {
    return ['show-notes'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'show-notes') {
      this.showNotes = newValue !== null;
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let html = '<style>';
    html += `
          :host { display: flex; width: 100%; height: 200px; position: relative; }
          .key { flex-grow: 1; height: 100%; background-color: white; border: 1px solid black; cursor: pointer; position: relative; }
          .key.black { position: absolute; background-color: black; height: 60%; width: 30px; z-index: 2; transform: translateX(-50%); }
          .key.active { background-color: #a0a0a0; }
          .key.white:active { background-color: #e0e0e0; }
          .key.black:active { background-color: #333; }
          .note-label { position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); font-size: 12px; }
          .black .note-label { color: white; bottom: 40%; }
      `;
    html += '</style>';

    let whiteKeyIndex = 0;
    for (let octave = 3; octave <= 5; octave++) {
      keys.forEach((key, index) => {
        const isBlack = key.includes('#');
        const className = `key ${isBlack ? 'black' : 'white'}`;
        const style = isBlack ? `left: ${whiteKeyIndex * (100 / 21) - 2}%;` : '';
        const note = `${key}${octave}`;
        html += `<div class="${className}" data-note="${note}" style="${style}">`;
        if (this.showNotes) {
          html += `<span class="note-label">${note}</span>`;
        }
        html += `</div>`;
        if (!isBlack) whiteKeyIndex++;
      });
    }

    this.shadowRoot.innerHTML = html;
  }

  setupEventListeners() {
    this.shadowRoot.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('key')) {
        const note = e.target.dataset.note;
        this.setKeyActive(note, true);
        this.dispatchEvent(new CustomEvent('notestart', { detail: { note } }));
      }
    });

    this.shadowRoot.addEventListener('mouseup', (e) => {
      if (e.target.classList.contains('key')) {
        const note = e.target.dataset.note;
        this.setKeyActive(note, false);
        this.dispatchEvent(new CustomEvent('noteend', { detail: { note } }));
      }
    });

    this.shadowRoot.addEventListener('mouseleave', (e) => {
      if (e.target.classList.contains('key')) {
        const note = e.target.dataset.note;
        this.setKeyActive(note, false);
        this.dispatchEvent(new CustomEvent('noteend', { detail: { note } }));
      }
    });
  }

  setKeyActive(note, isActive) {
    const key = this.shadowRoot.querySelector(`[data-note="${note}"]`);
    if (key) {
      if (isActive) {
        key.classList.add('active');
      } else {
        key.classList.remove('active');
      }
    }
  }

  // New API method to activate a key
  activateKey(note) {
    this.setKeyActive(note, true);
    setTimeout(() => this.setKeyActive(note, false), 200);
  }
}

customElements.define('piano-keyboard', PianoKeyboard);
