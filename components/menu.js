class XMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._menuData = [];
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  set items(data) {
    this._menuData = data;
    this.render();
  }

  get items() {
    return this._menuData;
  }

  render() {
    this.shadowRoot.innerHTML = `
        <style>
          :host {
            width: 100%;
            display: block;
          }
          :host::part(item){ 
            cursor: pointer;
            transition: all 0.3s;
          }
          :host::part(item-icon){
            font-style: normal;
          }
        </style>
        <ul part="menu" class="menu">
          ${this.renderMenu(this._menuData)}
        </ul>
      `;
  }

  renderMenu(items) {
    return items.map(item => this.renderMenuItem(item)).join('');
  }

  renderMenuItem(item) {
    const isLeaf = !item.children || item.children.length === 0;
    const classes = ['item'];
    if (item.open) classes.push('item-open');
    if (item.checked) classes.push('item-checked');
    if (isLeaf && item.active) classes.push('item-active');

    return `
        <li data-id="${item.id}">
          <div part="${classes.join(' ')}" >
            ${this.renderCheckbox(item)}
            ${this.renderIcon(item)}
            <span part="item-title">${item.title}</span>
          </div>
          ${this.renderSubmenu(item)}
        </li>
      `;
  }

  renderCheckbox(item) {
    return item.hasOwnProperty('checked')
      ? `<input part="item-checkbox" type="checkbox" ${item.checked ? 'checked' : ''}>`
      : '';
  }

  renderIcon(item) {
    return item.icon
      ? `<i part="item-icon">${item.icon}</i>`
      : '';
  }

  renderSubmenu(item) {
    return item.children
      ? `<ul part="menu" ${item.open ? '' : 'hidden'}>${this.renderMenu(item.children)}</ul>`
      : '';
  }

  addEventListeners() {
    this.shadowRoot.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick(e) {
    const li = e.target.closest('li');
    if (li) {
      e.preventDefault();
      e.stopPropagation();
      this.handleItemClick(li, e.target);
    }
  }

  handleItemClick(li, target) {
    const id = li.dataset.id;
    const item = this.findItemById(id, this._menuData);

    if (item) {
      this.dispatchEvent(new CustomEvent('item-click', {
        detail: { id, item },
        bubbles: true,
        composed: true,
      }));

      if (item.children && item.children.length > 0) {
        item.open = !item.open;
        this.dispatchEvent(new CustomEvent('item-open', {
          detail: { id, item, open: item.open },
          bubbles: true,
          composed: true,
        }));
      } else {
        this.setActiveItem(id);
      }

      if (item.hasOwnProperty('checked') && target.getAttribute('part').includes('item-checkbox')) {
        item.checked = !item.checked;
        this.dispatchEvent(new CustomEvent('item-checked', {
          detail: { id, item, checked: item.checked },
          bubbles: true,
          composed: true,
        }));
      }

      this.render();
    }
  }

  setActiveItem(id) {
    const previousActive = this.findActiveItem(this._menuData);
    this.deactivateAll(this._menuData);
    const item = this.findItemById(id, this._menuData);
    if (item && (!item.children || item.children.length === 0)) {
      item.active = true;
      this.dispatchEvent(new CustomEvent('item-active', {
        detail: { id, item, previousActiveId: previousActive ? previousActive.id : null },
        bubbles: true,
        composed: true,
      }));
    }
  }

  deactivateAll(items) {
    items.forEach(item => {
      if (!item.children || item.children.length === 0) {
        item.active = false;
      }
      if (item.children) {
        this.deactivateAll(item.children);
      }
    });
  }

  findItemById(id, items) {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = this.findItemById(id, item.children);
        if (found) return found;
      }
    }
    return null;
  }

  findActiveItem(items) {
    for (const item of items) {
      if (item.active) return item;
      if (item.children) {
        const found = this.findActiveItem(item.children);
        if (found) return found;
      }
    }
    return null;
  }

  refresh() {
    this.render();
  }
}

customElements.define('x-menu', XMenu);
