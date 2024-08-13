export class Sidebar {
  constructor(element) {
    this.element = element;
    this.menuItems = this.element.querySelectorAll('.sidebar-menu > li');
    this.state = 'expanded'; // 可能的值: 'expanded', 'mini', 'hidden'

    this.init();
  }

  init() {
    this.menuItems.forEach(item => this.setupMenuItem(item));
  }

  setState(newState) {
    this.state = newState;
    this.updateState();
  }

  updateState() {
    this.element.classList.remove('sidebar-mini', 'sidebar-hide');
    if (this.state === 'mini') {
      this.element.classList.add('sidebar-mini');
    } else if (this.state === 'hidden') {
      this.element.classList.add('sidebar-hide');
    }
  }

  setupMenuItem(item) {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const item = e.target.closest('li');
      const hasSubmenu = item.querySelector('ul');
      if (hasSubmenu) {
        item.classList.toggle('sidebar-item-collapsed');
      } else {
        this.element.querySelectorAll('.sidebar-item-active').forEach(i =>
          i.classList.remove('sidebar-item-active'));
        item.classList.add('sidebar-item-active');
      }
    });
  }

  addMenuItem(itemConfig) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = itemConfig.href || '#';

    const icon = document.createElement('i');
    icon.className = itemConfig.iconClass;
    a.appendChild(icon);

    const span = document.createElement('span');
    span.textContent = itemConfig.text;
    a.appendChild(span);

    li.appendChild(a);

    if (itemConfig.submenu) {
      const ul = document.createElement('ul');
      itemConfig.submenu.forEach(subItem => {
        const subLi = this.createSubMenuItem(subItem);
        ul.appendChild(subLi);
      });
      li.appendChild(ul);
    }

    this.element.querySelector('.sidebar-menu').appendChild(li);
    this.setupMenuItem(li);
  }

  createSubMenuItem(subItemConfig) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = subItemConfig.href || '#';

    const icon = document.createElement('i');
    icon.className = subItemConfig.iconClass;
    a.appendChild(icon);

    const span = document.createElement('span');
    span.textContent = subItemConfig.text;
    a.appendChild(span);

    li.appendChild(a);
    return li;
  }
}
