class XSelect extends HTMLSelectElement {
  constructor() {
    super();
    this._items = [];
  }

  static get observedAttributes() {
    return ['placeholder', 'value-field', 'text-field'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.render();
  }

  set items(value) {
    this._items = value;
    this.render();
  }

  get items() {
    return this._items;
  }

  render() {
    this.innerHTML = '';
    const placeholder = this.getAttribute('placeholder');
    if (placeholder) {
      const option = document.createElement('option');
      option.textContent = placeholder;
      option.value = '';
      option.disabled = true;
      option.selected = true;
      this.appendChild(option);
    }

    const valueField = this.getAttribute('value-field') || 'value';
    const textField = this.getAttribute('text-field') || 'text';

    this._items.forEach(item => {
      const option = document.createElement('option');
      option.value = item[valueField];
      option.textContent = item[textField];
      this.appendChild(option);
    });
  }
  addItem(item) {
    this._items.push(item);
    this.render();
  }
  removeItem(value) {
    const valueField = this.getAttribute('value-field') || 'value';
    this._items = this._items.filter(item => item[valueField] !== value);
    this.render();
  }
  clear() {
    this._items = [];
    this.render();
  }
  getSelectedItem() {
    const valueField = this.getAttribute('value-field') || 'value';
    const selectedValue = this.value;
    return this._items.find(item => item[valueField] == selectedValue);
  }
}

customElements.define('x-select', XSelect, { extends: 'select' });
