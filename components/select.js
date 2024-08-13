// x-select.js
class XSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._options = [];
    this._filteredOptions = [];
    this._selectedIndex = -1;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        .select-container {
          position: relative;
        }
        input {
          width: 100%;
          padding: 5px;
        }
        .dropdown {
          position: absolute;
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #ccc;
          display: none;
        }
        .dropdown.show {
          display: block;
        }
      </style>
      <div class="select-container">
        <input type="text" placeholder="Select or type...">
        <div class="dropdown"></div>
      </div>
    `;
  }

  addEventListeners() {
    const input = this.shadowRoot.querySelector('input');
    const dropdown = this.shadowRoot.querySelector('.dropdown');
    input.addEventListener('focus', () => dropdown.classList.add('show'));
    input.addEventListener('blur', () => setTimeout(() => dropdown.classList.remove('show'), 200));
    input.addEventListener('input', (e) => this.filterOptions(e.target.value));
    dropdown.addEventListener('click', (e) => {
      if (e.target.matches('x-select-option')) {
        this.selectOption(e.target);
      }
    });
  }

  filterOptions(filter) {
    this._filteredOptions = this._options.filter(option => 
      option.textContent.toLowerCase().includes(filter.toLowerCase())
    );
    this.updateDropdown();
  }

  updateDropdown() {
    const dropdown = this.shadowRoot.querySelector('.dropdown');
    dropdown.innerHTML = '';
    this._filteredOptions.forEach(option => dropdown.appendChild(option.cloneNode(true)));
  }

  selectOption(option) {
    const input = this.shadowRoot.querySelector('input');
    input.value = option.textContent;
    this.dispatchEvent(new CustomEvent('change', { detail: { value: option.value } }));
  }

  static get observedAttributes() {
    return ['placeholder'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'placeholder') {
      this.shadowRoot.querySelector('input').placeholder = newValue;
    }
  }

  get options() {
    return this._options;
  }

  set options(value) {
    this._options = Array.from(value);
    this._filteredOptions = [...this._options];
    this.updateDropdown();
  }
}

// x-select-option.js
class XSelectOption extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 5px;
          cursor: pointer;
        }
        :host(:hover) {
          background-color: #f0f0f0;
        }
      </style>
      <slot></slot>
    `;
  }

  get value() {
    return this.getAttribute('value');
  }

  set value(val) {
    this.setAttribute('value', val);
  }
}

customElements.define('x-select', XSelect);
customElements.define('x-select-option', XSelectOption);
