function normalizeOption(item, { value, label, disabled }) {
  if (item && typeof item === 'object') {
    return {
      value: value(item),
      label: label(item),
      disabled: disabled(item),
    };
  }
  return { value: item, label: item, disabled: false };
}

/** Populate a native HTMLSelectElement with safe text options. */
export function setSelectOptions(select, items, {
  value = item => item.value,
  label = item => item.label ?? item.text ?? item.value,
  disabled = item => Boolean(item.disabled),
  placeholder,
  selectedValue,
} = {}) {
  if (!select || typeof select.add !== 'function') {
    throw new TypeError('select must be an HTMLSelectElement');
  }
  for (const callback of [value, label, disabled]) {
    if (typeof callback !== 'function') throw new TypeError('option mappings must be functions');
  }
  const options = [];
  if (placeholder !== undefined) {
    const option = new Option(String(placeholder), '', false, selectedValue === undefined);
    option.disabled = true;
    option.hidden = true;
    options.push(option);
  }
  for (const item of items) {
    const normalized = normalizeOption(item, { value, label, disabled });
    const option = new Option(String(normalized.label ?? ''), String(normalized.value ?? ''));
    option.disabled = Boolean(normalized.disabled);
    option.__item = item;
    options.push(option);
  }
  select.replaceChildren(...options);
  if (selectedValue !== undefined) select.value = String(selectedValue);
  return select;
}

export function getSelectedItem(select) {
  return select.selectedOptions[0]?.__item;
}
