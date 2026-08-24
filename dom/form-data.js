/** Convert FormData entries to an object while preserving repeated names. */
export function formDataToObject(formData) {
  const output = Object.create(null);
  for (const [name, value] of formData) {
    if (!(name in output)) {
      output[name] = value;
    } else if (Array.isArray(output[name])) {
      output[name].push(value);
    } else {
      output[name] = [output[name], value];
    }
  }
  return output;
}

/** Create FormData from a form and convert it to an object. */
export function formToObject(form, submitter) {
  return formDataToObject(new FormData(form, submitter));
}

export const serialize = formToObject;
