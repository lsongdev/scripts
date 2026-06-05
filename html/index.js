import { createTreeWalker, createTemplate } from '../dom/index.js';

const PREFIX = `lit$${Math.random().toString(36).slice(2)}$`;
const MARKER = `{{${PREFIX}}}`;

export const nothing = Symbol('lit-nothing');
export const noChange = Symbol('lit-noChange');

// 模板缓存：同一个模板字面量位置的 strings 数组是同一个对象
const templateCache = new WeakMap();

/**
 * 模板结果对象
 */
export class TemplateResult {
  constructor(strings, values) {
    this.strings = strings;
    this.values = values;
  }
}

/**
 * 标签模板函数
 * @example
 * const template = html`<div class=${cls}>${content}</div>`;
 */
export const html = (strings, ...values) => {
  return new TemplateResult(strings, values);
};

// 判断字符串末尾是否是属性绑定的开始
const getTemplateHTML = (strings) => {
  let html = '';
  for (let i = 0; i < strings.length - 1; i++) {
    const s = strings[i];
    const match = /(^|\s)([^\s=<>"'\`]+)=(["']?)\s*$/.exec(s);
    if (match) {
      const quote = match[3];
      // 如果已经有引号，不额外添加；否则用双引号包裹
      html += s + (quote ? MARKER : `"${MARKER}"`);
    } else {
      html += s + MARKER;
    }
  }
  html += strings[strings.length - 1];
  return html;
};

/**
 * NodePart：负责文本/节点/嵌套模板/数组的更新
 */
class NodePart {
  constructor(startNode, endNode) {
    this.startNode = startNode;
    this.endNode = endNode;
    this._value = undefined;
    this._lastValue = undefined;
  }

  setValue(value) {
    this._value = value;
  }

  commit() {
    if (this._value === noChange) return;

    if (this._value === nothing || this._value == null) {
      this._clear();
      return;
    }

    // 嵌套模板
    if (this._value instanceof TemplateResult) {
      const container = document.createDocumentFragment();
      render(this._value, container);
      this._clear();
      this.startNode.parentNode.insertBefore(container, this.endNode);
      return;
    }

    // 数组
    if (Array.isArray(this._value)) {
      this._clear();
      const fragment = document.createDocumentFragment();
      for (const item of this._value) {
        if (item instanceof Node) {
          fragment.appendChild(item);
        } else if (item instanceof TemplateResult) {
          const container = document.createDocumentFragment();
          render(item, container);
          fragment.appendChild(container);
        } else {
          fragment.appendChild(document.createTextNode(String(item)));
        }
      }
      this.startNode.parentNode.insertBefore(fragment, this.endNode);
      return;
    }

    // DOM 节点
    if (this._value instanceof Node) {
      if (this._lastValue === this._value) return;
      this._clear();
      this.startNode.parentNode.insertBefore(this._value, this.endNode);
      this._lastValue = this._value;
      return;
    }

    // 文本
    const str = String(this._value);
    const node = this.startNode.nextSibling;
    if (node === this.endNode) {
      const text = document.createTextNode(str);
      this.startNode.parentNode.insertBefore(text, this.endNode);
    } else if (node.nodeType === Node.TEXT_NODE && node.nextSibling === this.endNode) {
      if (node.textContent !== str) node.textContent = str;
    } else {
      this._clear();
      const text = document.createTextNode(str);
      this.startNode.parentNode.insertBefore(text, this.endNode);
    }
    this._lastValue = this._value;
  }

  _clear() {
    let node = this.startNode.nextSibling;
    while (node && node !== this.endNode) {
      const next = node.nextSibling;
      node.remove();
      node = next;
    }
    this._lastValue = undefined;
  }
}

/**
 * AttributePart：负责属性的更新
 * 支持：@事件, .属性, ?布尔属性, class, style对象, 普通属性
 */
class AttributePart {
  constructor(element, name) {
    this.element = element;
    this.name = name;
    this._value = undefined;
  }

  setValue(value) {
    this._value = value;
  }

  commit() {
    if (this._value === noChange) return;

    const name = this.name;

    // 事件绑定：@click=${handler}
    if (name.startsWith('@')) {
      const eventName = name.slice(1);
      if (this._oldHandler) {
        this.element.removeEventListener(eventName, this._oldHandler);
      }
      if (typeof this._value === 'function') {
        this.element.addEventListener(eventName, this._value);
        this._oldHandler = this._value;
      }
      return;
    }

    // 属性设置：.value=${val}
    if (name.startsWith('.')) {
      this.element[name.slice(1)] = this._value;
      return;
    }

    // 布尔属性：?disabled=${bool}
    if (name.startsWith('?')) {
      const attr = name.slice(1);
      if (this._value) {
        this.element.setAttribute(attr, '');
      } else {
        this.element.removeAttribute(attr);
      }
      return;
    }

    // class 特殊处理
    if (name === 'class') {
      this.element.className = this._value || '';
      return;
    }

    // style 对象处理
    if (name === 'style' && typeof this._value === 'object') {
      Object.assign(this.element.style, this._value);
      return;
    }

    // 普通属性
    if (this._value == null || this._value === false) {
      this.element.removeAttribute(name);
    } else {
      this.element.setAttribute(name, this._value === true ? '' : String(this._value));
    }
  }
}

/**
 * Template：解析模板字符串，找出所有动态位置（Part）
 */
class Template {
  constructor(strings) {
    this.strings = strings;
    this.parts = [];
    this._prepare();
  }

  _prepare() {
    const template = createTemplate(getTemplateHTML(this.strings));
    let partIndex = 0;

    // 按文档顺序收集所有节点，然后统一处理
    const walker = createTreeWalker(template, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode()) !== null) {
      nodes.push(node);
    }

    for (node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // 处理属性 marker
        const attrs = Array.from(node.attributes);
        for (const attr of attrs) {
          if (attr.value === MARKER) {
            this.parts.push({ type: 'attribute', index: partIndex, element: node, name: attr.name });
            node.removeAttribute(attr.name);
            partIndex++;
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.data.includes(MARKER)) {
        // 处理文本 marker
        const parts = node.data.split(MARKER);
        const parent = node.parentNode;
        const lastIndex = parts.length - 1;

        for (let i = 0; i < lastIndex; i++) {
          if (parts[i]) {
            parent.insertBefore(document.createTextNode(parts[i]), node);
          }
          const startMarker = document.createComment(`${PREFIX}${partIndex}`);
          parent.insertBefore(startMarker, node);
          this.parts.push({ type: 'node', index: partIndex, startNode: startMarker });
          partIndex++;
        }

        if (parts[lastIndex]) {
          parent.insertBefore(document.createTextNode(parts[lastIndex]), node);
        }

        parent.removeChild(node);
      }
    }

    // 设置 node part 的 endNode
    for (let i = 0; i < this.parts.length; i++) {
      if (this.parts[i].type === 'node') {
        const next = this.parts[i + 1];
        if (next && next.type === 'node') {
          this.parts[i].endNode = next.startNode;
        } else {
          const endMarker = document.createComment(`/${PREFIX}`);
          this.parts[i].startNode.parentNode.insertBefore(
            endMarker,
            this.parts[i].startNode.nextSibling
          );
          this.parts[i].endNode = endMarker;
        }
      }
    }

    this.element = template;
  }
}

/**
 * TemplateInstance：模板的具体 DOM 实例
 */
class TemplateInstance {
  constructor(template) {
    this.template = template;
    this._parts = [];
    this.fragment = document.importNode(template.element, true);
    this._init();
  }

  _init() {
    // 收集所有带 PREFIX 的注释节点
    const nodeMap = new Map();
    const commentWalker = createTreeWalker(this.fragment, NodeFilter.SHOW_COMMENT);
    let node;
    while ((node = commentWalker.nextNode()) !== null) {
      const data = node.data;
      if (data.startsWith(PREFIX)) {
        const index = parseInt(data.slice(PREFIX.length), 10);
        nodeMap.set(index, node);
      }
    }

    // 收集 template 和 fragment 中的元素，按文档顺序配对
    const templateElements = [];
    const tWalker = createTreeWalker(this.template.element, NodeFilter.SHOW_ELEMENT);
    while ((node = tWalker.nextNode()) !== null) {
      templateElements.push(node);
    }

    const fragmentElements = [];
    const fWalker = createTreeWalker(this.fragment, NodeFilter.SHOW_ELEMENT);
    while ((node = fWalker.nextNode()) !== null) {
      fragmentElements.push(node);
    }

    const elementMap = new Map();
    for (let i = 0; i < templateElements.length; i++) {
      elementMap.set(templateElements[i], fragmentElements[i]);
    }

    // 创建 Part 实例
    for (const part of this.template.parts) {
      if (part.type === 'node') {
        const startNode = nodeMap.get(part.index);
        let endNode = startNode.nextSibling;
        while (endNode) {
          if (endNode.nodeType === Node.COMMENT_NODE) {
            const data = endNode.data;
            if (data === `/${PREFIX}` || data.startsWith(PREFIX)) {
              break;
            }
          }
          endNode = endNode.nextSibling;
        }
        this._parts.push(new NodePart(startNode, endNode));
      } else if (part.type === 'attribute') {
        this._parts.push(new AttributePart(elementMap.get(part.element), part.name));
      }
    }
  }

  update(values) {
    for (let i = 0; i < this._parts.length; i++) {
      this._parts[i].setValue(values[i]);
      this._parts[i].commit();
    }
  }
}

/**
 * 将模板结果渲染到容器中
 * @param {TemplateResult|any} result - 模板结果或普通值
 * @param {HTMLElement|DocumentFragment} container - 渲染目标
 * @example
 * render(html`<h1>Hello ${name}</h1>`, document.body);
 */
export const render = (result, container) => {
  // 非模板值：直接文本渲染
  if (!(result instanceof TemplateResult)) {
    container.textContent = '';
    if (result != null && result !== nothing) {
      container.appendChild(document.createTextNode(String(result)));
    }
    return;
  }

  let instance = container._templateInstance;

  // 相同模板：只更新值
  if (instance && instance.template.strings === result.strings) {
    instance.update(result.values);
    return;
  }

  // 新模板：创建并缓存
  let template = templateCache.get(result.strings);
  if (!template) {
    template = new Template(result.strings);
    templateCache.set(result.strings, template);
  }

  instance = new TemplateInstance(template);
  instance.update(result.values);
  container._templateInstance = instance;

  container.textContent = '';
  container.appendChild(instance.fragment);
};
