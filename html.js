import { createTreeWalker, createTemplate } from './dom.js';

const prefix = 'isµ';
const empty = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
const elements = /<([a-z]+[a-z0-9:._-]*)([^>]*?)(\/?)>/g;
const attributes = /([^\s\\>"'=]+)\s*=\s*(['"]?)\x01/g;
const holes = /[\x01\x02]/g;

export const transform = (template, prefix, svg) => {
  let i = 0;
  return template
    .join('\x01')
    .trim()
    .replace(elements, (_, name, attrs, selfClosing) => {
      let ml = name + attrs.replace(attributes, '\x02=$2$1').trimEnd();
      if (selfClosing.length)
        ml += (svg || empty.test(name)) ? ' /' : ('></' + name);
      return '<' + ml + '>';
    })
    .replace(holes, hole => hole === '\x01' ? ('<!--' + prefix + i++ + '-->') : (prefix + i++));
};

export const collect = (fragment, len) => {
  const updates = [];
  const tw = createTreeWalker(fragment, 1 | 128);
  let i = 0;
  let search = `${prefix}${i}`;
  while (i < len - 1) {
    const node = tw.nextNode();
    if (!node) throw `bad template: ${text}`;
    if (node.nodeType === 8 && node.data === search) {
      updates.push({ type: 'node', node });
      search = `${prefix}${++i}`;
    } else {
      while (node.hasAttribute(search)) {
        updates.push({
          type: 'attr',
          node,
          name: node.getAttribute(search)
        });
        node.removeAttribute(search);
        search = `${prefix}${++i}`;
      }
    }
  }
  return updates;
};

const handleAttribute = (node, name, value) => {
  switch (name[0]) {
    case '?':
      if (value) node.setAttribute(name.slice(1), true);
      else node.removeAttribute(name.slice(1));
      break;
    case '@':
      node.addEventListener(name.slice(1), value);
      break;
    case '.':
      node[name] = value;
      break;
    default:
      node.setAttribute(name, value);
      break;
  }
};

const handle = ({ type, node, name }, value) => {
  switch (type) {
    case 'node':
      node.replaceWith(value);
      break;
    case 'attr':
      handleAttribute(node, name, value);
      break;
  }
};

export const html = (template, ...values) => {
  const text = transform(template, prefix);
  const fragment = createTemplate(text);
  const updates = collect(fragment, template.length);
  updates.forEach((update, i) => handle(update, values[i]));
  return fragment.childNodes;
};
