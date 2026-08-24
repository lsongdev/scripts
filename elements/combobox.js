import { defineElement } from './define.js';

let optionSequence = 0;

export class RichOption extends HTMLElement {
  static observedAttributes = ['disabled', 'value'];

  connectedCallback() {
    this.setAttribute('role', 'option');
    if (!this.id) this.id = `rich-option-${optionSequence += 1}`;
    this.#notify();
  }

  attributeChangedCallback() { if (this.isConnected) this.#notify(); }
  get value() { return this.getAttribute('value') ?? this.textContent.trim(); }
  set value(value) { this.setAttribute('value', value); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }

  #notify() {
    this.setAttribute('aria-disabled', String(this.disabled));
    this.dispatchEvent(new Event('optionchange', { bubbles: true }));
  }
}

export class RichCombobox extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['aria-label', 'disabled', 'name', 'placeholder', 'required', 'value'];

  #internals;
  #input;
  #listbox;
  #active;
  #value = '';

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:inline-block;position:relative}.listbox{background:Canvas;border:1px solid;box-sizing:border-box;left:0;max-height:15rem;overflow:auto;position:absolute;top:100%;width:100%;z-index:1}.listbox[hidden]{display:none}::slotted(rich-option){cursor:default;display:block;padding:.25rem .5rem}::slotted([data-active]),::slotted([aria-selected="true"]){background:Highlight;color:HighlightText}::slotted([aria-disabled="true"]){opacity:.5}';
    this.#input = document.createElement('input');
    this.#input.type = 'text';
    this.#input.setAttribute('role', 'combobox');
    this.#input.setAttribute('aria-autocomplete', 'list');
    this.#input.setAttribute('aria-expanded', 'false');
    this.#input.setAttribute('aria-controls', 'options');
    this.#listbox = document.createElement('div');
    this.#listbox.id = 'options';
    this.#listbox.className = 'listbox';
    this.#listbox.setAttribute('role', 'listbox');
    this.#listbox.hidden = true;
    this.#listbox.append(document.createElement('slot'));
    root.append(style, this.#input, this.#listbox);

    this.#input.addEventListener('focus', () => this.open());
    this.#input.addEventListener('input', () => this.#filter());
    this.#input.addEventListener('keydown', event => this.#keydown(event));
    this.addEventListener('click', event => {
      const option = event.target.closest('rich-option');
      if (option && !option.disabled) this.#select(option, true);
    });
    this.addEventListener('optionchange', () => this.#synchronize());
    this.#listbox.querySelector('slot').addEventListener('slotchange', () => this.#synchronize());
    this.addEventListener('focusout', () => queueMicrotask(() => {
      if (!this.matches(':focus-within')) this.close();
    }));
  }

  connectedCallback() { this.#synchronize(); }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && oldValue !== newValue) this.#value = newValue ?? '';
    if (this.isConnected) this.#synchronize();
  }

  get form() { return this.#internals.form; }
  get name() { return this.getAttribute('name') ?? ''; }
  get type() { return 'rich-combobox'; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  get willValidate() { return this.#internals.willValidate; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }

  get value() { return this.#value; }
  set value(value) {
    const normalized = String(value ?? '');
    if (this.#value === normalized) return;
    this.#value = normalized;
    this.#synchronize();
  }

  get options() { return [...this.querySelectorAll(':scope > rich-option')]; }
  get selectedOption() { return this.options.find(option => option.value === this.#value); }

  open() {
    if (this.hasAttribute('disabled')) return;
    this.#listbox.hidden = false;
    this.#input.setAttribute('aria-expanded', 'true');
    this.#active = this.selectedOption ?? this.#visible()[0];
    this.#renderActive();
  }

  close() {
    this.#listbox.hidden = true;
    this.#input.setAttribute('aria-expanded', 'false');
    this.#input.removeAttribute('aria-activedescendant');
    this.#active = undefined;
  }

  formResetCallback() { this.value = this.getAttribute('value') ?? ''; }
  formStateRestoreCallback(state) { this.value = state ?? ''; }
  formDisabledCallback(disabled) { this.#input.disabled = disabled; }

  #visible() { return this.options.filter(option => !option.hidden && !option.disabled); }

  #synchronize() {
    if (this.#value === '' && this.hasAttribute('value')) this.#value = this.getAttribute('value');
    this.#input.disabled = this.hasAttribute('disabled');
    this.#input.placeholder = this.getAttribute('placeholder') ?? '';
    const accessibleName = this.getAttribute('aria-label');
    if (accessibleName) this.#input.setAttribute('aria-label', accessibleName);
    else this.#input.removeAttribute('aria-label');
    let selected = this.selectedOption;
    if (this.options.length && this.#value && !selected) {
      this.#value = '';
      selected = undefined;
    }
    if (selected && this.shadowRoot.activeElement !== this.#input) this.#input.value = selected.textContent.trim();
    for (const option of this.options) {
      option.setAttribute('aria-selected', String(option === selected));
    }
    this.#internals.setFormValue(this.#value || null);
    const missing = this.hasAttribute('required') && !this.#value;
    this.#internals.setValidity(missing ? { valueMissing: true } : {},
      missing ? 'Please select an option.' : '', this.#input);
  }

  #filter() {
    const query = this.#input.value.toLocaleLowerCase();
    for (const option of this.options) {
      option.hidden = !option.textContent.toLocaleLowerCase().includes(query);
    }
    this.open();
  }

  #move(delta) {
    const options = this.#visible();
    if (!options.length) return;
    const index = Math.max(0, options.indexOf(this.#active));
    this.#active = options[(index + delta + options.length) % options.length];
    this.#renderActive();
  }

  #renderActive() {
    for (const option of this.options) option.toggleAttribute('data-active', option === this.#active);
    if (this.#active) {
      this.#input.setAttribute('aria-activedescendant', this.#active.id);
      this.#active.scrollIntoView({ block: 'nearest' });
    }
  }

  #keydown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.#listbox.hidden) this.open();
      else this.#move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const options = this.#visible();
      this.#active = options[event.key === 'Home' ? 0 : options.length - 1];
      this.#renderActive();
    } else if (event.key === 'Enter' && this.#active) {
      event.preventDefault();
      this.#select(this.#active, true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.#input.value = this.selectedOption?.textContent.trim() ?? '';
    }
  }

  #select(option, notify) {
    this.value = option.value;
    this.#input.value = option.textContent.trim();
    this.close();
    if (notify) {
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

export function defineRichCombobox(registry) {
  defineElement('rich-option', RichOption, undefined, registry);
  return defineElement('rich-combobox', RichCombobox, undefined, registry);
}
