import {
  querySelector,
  createElement,
  createLabel,
  createInput,
  createSelect,
  createRadio,
  createCheckbox,
  createTextarea,
} from './dom.js';

// Form serialization
export const serialize = (form) => {
  const output = {};
  const elements = Array.from(form.elements);

  elements.forEach(element => {
    if (!element.name || element.disabled || /(file|reset|submit|button)/i.test(element.type)) {
      return;
    }
    const { name, type, value, checked, options, selectedOptions } = element;
    if (type === 'select-multiple') {
      output[name] = Array.from(selectedOptions).map(option => option.value);
    } else if (/(radio|checkbox)/i.test(type)) {
      if (checked) {
        output[name] = output[name]
          ? [].concat(output[name], value === 'on' ? true : value)
          : (value === 'on' ? true : value);
      }
    } else if (value || value === 0) {
      output[name] = output[name]
        ? [].concat(output[name], value)
        : value;
    }
  });
  return output;
};

// Form validation
export const validate = (form, rules, toCheck) => {
  const data = serialize(form);
  const errors = {};
  let isValid = true;

  const applyRule = (key, rule) => {
    const result = (rule.test || rule).call(rule, data[key], data);
    if (result !== true) {
      errors[key] = result;
      isValid = false;
      Array.from(form.elements[key] || []).forEach(el => el.isValid = false);
    } else {
      Array.from(form.elements[key] || []).forEach(el => el.isValid = true);
    }
  };

  if (toCheck && toCheck.trim) {
    applyRule(toCheck, rules[toCheck]);
  } else {
    Object.keys(rules).forEach(key => applyRule(key, rules[key]));
  }

  form.isValid = isValid;
  return errors;
};

// Form binding
export const bind = (form, options = {}) => {
  if (typeof form === 'string') form = querySelector(form);

  form.serialize = () => serialize(form);
  form.validate = () => validate(form, options.rules);

  form.onsubmit = (event) => {
    event.preventDefault();
    event.errors = form.errors = form.validate();
    return form.isValid ? options.onSubmit?.(event) : options.onError?.(event);
  };

  return form;
};

// Form request handling
export const requestForm = (form, options) => {
  if (typeof form === 'string') form = querySelector(form);
  if (typeof options === 'function') {
    options = {
      onError: options,
      onSuccess: options.bind(null, null)
    };
  }

  const {
    onFormat = defaultFormatRequest,
    onRequest = defaultRequest,
    onResponse = defaultResponse,
    onSubmit = defaultSubmit,
    onSuccess,
    onError
  } = options;

  return bind(form, {
    onSubmit: () => onSubmit({ form, onFormat, onRequest, onResponse, onSuccess, onError })
  });
};

const defaultFormatRequest = ({ method, url, data, enctype }) => {
  if (enctype === 'application/x-www-form-urlencoded') {
    const qs = new URLSearchParams(data).toString();
    return { url: `${url}?${qs}`, method };
  }
  return { url, method, data };
};

const defaultRequest = ({ url, ...opts }) => fetch(url, opts);

const defaultResponse = (res, type) => type === 'json' ? res.json() : res;

const defaultSubmit = ({ form, onFormat, onRequest, onResponse, onSuccess, onError }) => {
  const { method, action: url } = form;
  const data = form.serialize();
  const enctype = form.getAttribute('enctype') || 'application/x-www-form-urlencoded';
  const type = form.getAttribute('type');

  const request = onFormat({ method, url, data, enctype });
  return onRequest(request)
    .then(res => onResponse(res, type))
    .then(onSuccess, onError);
};

// Form persistence
const PERSISTENCE_ATTR = 'data-persist';

export const saveElementValue = (element) => {
  if (typeof element === 'string') element = querySelector(element);
  const key = element.getAttribute(PERSISTENCE_ATTR) || element.id || element.name;
  if (key) {
    const value = element.type === 'checkbox' ? element.checked : element.value;
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const restoreElementValue = (element) => {
  const key = element.getAttribute(PERSISTENCE_ATTR) || element.id || element.name;
  if (key) {
    const value = JSON.parse(localStorage.getItem(key));
    if (value !== null) {
      element.type === 'checkbox' ? element.checked = value : element.value = value;
    }
  }
};

export const initFormPersistence = () => {
  const elements = document.querySelectorAll(`[${PERSISTENCE_ATTR}]`);
  elements.forEach(element => {
    restoreElementValue(element);
    element.addEventListener('change', () => saveElementValue(element));
    if (['INPUT', 'TEXTAREA'].includes(element.tagName)) {
      element.addEventListener('input', () => saveElementValue(element));
    }
  });
};


export const createFormField = ({ type, id = '', name, label: title, options, ...attrs }) => {
  const fieldDiv = createElement('div', { className: 'form-field' });
  const mainLabel = createLabel(title, id);
  fieldDiv.appendChild(mainLabel);
  switch (type) {
    case 'select':
      fieldDiv.appendChild(createSelect({ id, name, ...attrs }, options));
      break;
    case 'radio':
    case 'checkbox':
      options.map(option => {
        const id = `${name}_${option.value}`;
        fieldDiv.appendChild(type === 'radio' ?
          createRadio({ id, ...option }) :
          createCheckbox({ id, ...option }));
        fieldDiv.appendChild(createLabel(option.label, id));
      });
      break;
    case 'textarea':
      fieldDiv.appendChild(createTextarea({ id, name, ...attrs }));
      break;
    default:
      fieldDiv.appendChild(createInput({ type, id, name, ...attrs }));
      break;
  }

  return fieldDiv;
};

export const createFormFields = fields => fields.map(createFormField);
