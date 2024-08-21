import { querySelector } from './dom.js';
import { stringify } from './query.js'

// part of source code from: https://github.com/lukeed/formee

export function serialize(form) {
  var i = 0, j, key, tmp, out = {};
  var rgx1 = /(radio|checkbox)/i;
  var rgx2 = /(file|reset|submit|button)/i;
  while (tmp = form.elements[i++]) {
    // Ignore unnamed, disabled, or (...rgx2) inputs
    if (!tmp.name || tmp.disabled || rgx2.test(tmp.type)) continue;
    key = tmp.name;
    // Grab all values from multi-select
    if (tmp.type === 'select-multiple') {
      out[key] = [];
      for (j = 0; j < tmp.options.length; j++) {
        if (tmp.options[j].selected) {
          out[key].push(tmp.options[j].value);
        }
      }
    } else if (rgx1.test(tmp.type)) {
      if (tmp.checked) {
        j = out[key];
        tmp = tmp.value === 'on' || tmp.value;
        out[key] = (j == null && j !== 0) ? tmp : [].concat(j, tmp);
      }
    } else if (tmp.value || tmp.value === 0) {
      j = out[key];
      out[key] = (j == null && j !== 0) ? tmp.value : [].concat(j, tmp.value);
    }
  }

  return out;
}

export function validate(form, rules, toCheck) {
  rules = rules || {};
  var nxt, arr, isOkay = true, out = {};
  var k, msg, len, data = serialize(form);

  if (toCheck && toCheck.trim) {
    nxt = {};
    nxt[toCheck] = rules[toCheck];
    rules = nxt;
  }

  for (k in rules) {
    // Accomodate Function or RegExp
    msg = (rules[k].test || rules[k]).call(rules[k], data[k], data);
    // Accomodate radio|checkbox groups
    nxt = form.elements[k];
    arr = nxt.length ? nxt : [nxt];
    for (len = arr.length; len--;) {
      arr[len].isValid = (msg === true) || (out[k] = msg, isOkay = false);
    }
  }

  form.isValid = isOkay;
  return out;
}

export function bind(form, opts = {}) {
  if (typeof form === 'string')
    form = querySelector(form);

  form.serialize = serialize.bind(null, form);
  form.validate = validate.bind(null, form, opts.rules);

  form.onsubmit = function (ev) {
    ev.preventDefault();
    ev.errors = form.errors = form.validate();
    return form.isValid ? opts.onSubmit(ev) : opts.onError(ev);
  };
  return form;
}

export const requestForm = (form, options) => {
  if (typeof form === 'string')
    form = querySelector(form);
  if (typeof options === 'function') {
    options = {
      onError: options,
      onSuccess: options.bind(null, null)
    };
  }
  const type = form.getAttribute('type');
  const enctype = form.getAttribute('enctype') || 'application/x-www-form-urlencoded';
  const onFormat = options.onFormat || (({ method, url, data }) => {
    switch (enctype) {
      case 'application/x-www-form-urlencoded':
        const qs = stringify(data);
        return { url: `${url}?${qs}`, method };
    }
  });
  const onRequest = options.onRequest || (({ url, ...opts }) => fetch(url, opts));
  const onResponse = options.onResponse || (res => {
    if (type === 'json') return res.json();
    return res;
  });
  const onSubmit = options.onSubmit || (() => {
    const { method, action: url } = form;
    const data = form.serialize();
    const request = onFormat({ method, url, data });
    return onRequest(request).then(onResponse).then(onSuccess, onError);
  });
  const { onSuccess, onError } = options;
  return bind(form, { onSubmit })
};


const PERSISTENCE_ATTR = 'data-persist';

export function saveElementValue(element) {
  if (typeof element === 'string') {
    element = document.querySelector(element);
  }
  const key = element.getAttribute(PERSISTENCE_ATTR) || element.id || element.name;
  if (key) {
    const value = element.type === 'checkbox' ? element.checked : element.value;
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function restoreElementValue(element) {
  const key = element.getAttribute(PERSISTENCE_ATTR) || element.id || element.name;
  if (key) {
    const value = JSON.parse(localStorage.getItem(key));
    if (value !== null) {
      if (element.type === 'checkbox') {
        element.checked = value;
      } else {
        element.value = value;
      }
    }
  }
}

export function initFormPersistence() {
  const elements = document.querySelectorAll(`[${PERSISTENCE_ATTR}]`);
  elements.forEach(element => {
    restoreElementValue(element);
    element.addEventListener('change', () => saveElementValue(element));
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.addEventListener('input', () => saveElementValue(element));
    }
  });
}

export const createFormField = () => {
  const field = document.createElement('div');
  field.className = 'form-field';
  return field;
}

export function generateForm(formStructure) {
  const form = document.createElement('form');
  form.className = 'form';

  formStructure.forEach(field => {
    const container = createFormField();
    const label = document.createElement('label');
    label.textContent = field.label;
    container.appendChild(label);
    let input;
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        input = document.createElement('input');
        input.type = field.type;
        input.className = 'input input-block';
        break;
      case 'textarea':
        input = document.createElement('textarea');
        input.className = 'input input-block';
        break;
      case 'select':
        input = document.createElement('select');
        input.className = 'select';
        field.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          input.appendChild(optionElement);
        });
    }
    input.id = field.name;
    input.name = field.name;
    if (field.required) input.required = true;
    container.appendChild(input);
    form.appendChild(container);
  });

  const f = createFormField();
  const button = document.createElement('button');
  button.textContent = 'Submit';
  f.appendChild(button)
  form.appendChild(f);
  return form;
}
