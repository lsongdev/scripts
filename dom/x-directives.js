// 自定义DOM属性模块

// 创建深层代理
function createDeepProxy(target, handler, path = '') {
  if (typeof target !== 'object' || target === null) {
    return target;
  }
  const proxyHandler = {
    get(target, property) {
      const value = Reflect.get(target, property);
      return createDeepProxy(value, handler, path ? `${path}.${property}` : property);
    },
    set(target, property, value) {
      const oldValue = target[property];
      const result = Reflect.set(target, property, value);
      if (oldValue !== value) {
        handler(path ? `${path}.${property}` : property, value, target);
      }
      return result;
    }
  };

  return new Proxy(target, proxyHandler);
}

// 处理x-data属性
function handleXData(el) {
  const dataAttr = el.getAttribute('x-data');
  if (dataAttr) {
    try {
      el.$data = JSON.parse(dataAttr);
    } catch (e) {
      console.error('Invalid JSON in x-data attribute:', e);
      el.$data = {};
    }
  }
  if (!el.$data) {
    el.$data = {};
  }

  // 只有当 $data 是对象时才创建代理
  if (typeof el.$data === 'object' && el.$data !== null) {
    el.$data = createDeepProxy(el.$data, (prop, value, target) => {
      el.dispatchEvent(new CustomEvent('x-data-changed', { detail: { prop, value, target } }));
    });
  }
}

// 处理x-text属性
function handleXText(el) {
  var textAttr = el.getAttribute('x-text');
  const parentWithData = el.closest('[x-data]');
  if (!parentWithData) return;
  if (!textAttr) textAttr = '$data';
  function updateText() {
    el.textContent = new Function('$data', `with($data){ return ${textAttr}; }`).call(null, parentWithData.$data);
  }

  updateText();
  parentWithData.addEventListener('x-data-changed', updateText);
}

// 处理x-for属性
function handleXFor(el) {
  if (el.tagName !== 'TEMPLATE') return;
  const forAttr = el.getAttribute('x-for');
  const parentWithData = el.closest('[x-data]');
  if (!parentWithData) return;

  var previousElements = [];
  function updateList() {
    for (let i = 0; i < previousElements.length; i++) {
      el.parentNode.removeChild(previousElements[i]);
    }
    previousElements = [];
    const container = document.createDocumentFragment();
    let items;
    try {
      items = new Function('$data', `with($data){ return ${forAttr}; }`).call(null, parentWithData.$data);
    } catch (error) {
      console.error('Error in x-for:', error);
      return;
    }

    if (!Array.isArray(items)) {
      console.error('x-for requires an array');
      return;
    }

    items.forEach(item => {
      const clone = el.content.cloneNode(true);
      const itemEl = clone.firstElementChild;
      itemEl.setAttribute('x-data', '');
      itemEl.$data = item;
      container.appendChild(itemEl);
      previousElements.push(itemEl);
    });
    el.parentNode.insertBefore(container, el.nextSibling);
  }

  updateList();
  parentWithData.addEventListener('x-data-changed', updateList);
}

// 监听DOM变化并处理新添加的元素
function observeDOMChanges() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.hasAttribute('x-data')) {
            handleXData(node);
          }
          if (node.hasAttribute('x-text')) {
            handleXText(node);
          }
          if (node.hasAttribute('x-for')) {
            handleXFor(node);
          }
          node.querySelectorAll('[x-data], [x-text], [x-for]').forEach(el => {
            if (el.hasAttribute('x-data')) handleXData(el);
            if (el.hasAttribute('x-text')) handleXText(el);
            if (el.hasAttribute('x-for')) handleXFor(el);
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// 初始化函数
function initCustomAttributes() {
  // 首先设置 MutationObserver
  observeDOMChanges();

  // 然后处理现有的元素
  document.querySelectorAll('[x-data]').forEach(handleXData);
  document.querySelectorAll('[x-text]').forEach(handleXText);
  document.querySelectorAll('[x-for]').forEach(handleXFor);
}

// 导出初始化函数，以便在模块中使用
export default initCustomAttributes;
