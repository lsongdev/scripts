

export function fetch(url, { method = 'get', headers = {}, body, credentials } = {}) {
  const response = () => {
    const headers = {};
    xhr
      .getAllResponseHeaders()
      .replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, (m, key, value) => {
        headers[key] = value;
      });
    return {
      headers: {
        keys: () => Object.keys(headers),
        entries: () => Object.entries(headers),
        get: n => headers[n.toLowerCase()],
        has: n => n.toLowerCase() in headers
      },
      clone: response,
      url: xhr.responseURL,
      status: xhr.status,
      statusText: xhr.statusText,
      ok: (xhr.status / 100 | 0) == 2,
      text: () => Promise.resolve(xhr.responseText),
      json: () => Promise.resolve(JSON.parse(xhr.responseText)),
      blob: () => Promise.resolve(new Blob([xhr.response])),
    };
  };
  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    Object.entries(headers).forEach(([key, value]) =>
      xhr.setRequestHeader(key, value));
    xhr.withCredentials = credentials == 'include';
    xhr.open(method, url, true);
    xhr.onerror = reject;
    xhr.onload = () => resolve(response());
    xhr.send(body);
  });
};
