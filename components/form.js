import { define, wrap } from '../webcomponent.js';
import { serialize } from '../form.js';

define('x-form', class extends wrap(HTMLFormElement) {
  static get observedAttributes() {
    return ['method', 'action', 'content-type'];
  }

  constructor() {
    super();
    this.abortController = new AbortController();
  }

  async handleSubmit(e) {
    e.preventDefault();
    const { method, action: url } = this;
    const data = serialize(this);
    
    let fetchOptions = {
      method: method.toUpperCase(),
      headers: {},
      signal: this.abortController.signal
    };

    const contentType = this.getAttribute('content-type') || 'application/json';

    switch (contentType) {
      case 'application/json':
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(data);
        break;
      case 'application/x-www-form-urlencoded':
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        fetchOptions.body = new URLSearchParams(data).toString();
        break;
      case 'multipart/form-data':
        const formData = new FormData();
        for (const [key, value] of Object.entries(data)) {
          formData.append(key, value);
        }
        fetchOptions.body = formData;
        break;
      default:
        console.warn(`Unsupported content type: ${contentType}. Defaulting to application/json.`);
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(data);
    }

    // 添加自定义请求头
    const customHeaders = this.getAttribute('custom-headers');
    if (customHeaders) {
      try {
        const headers = JSON.parse(customHeaders);
        Object.assign(fetchOptions.headers, headers);
      } catch (error) {
        console.error('Error parsing custom headers:', error);
      }
    }

    try {
      this.dispatchEvent(new CustomEvent('submitstart'));
      const response = await fetch(url, fetchOptions);
      let responseData;
      const contentTypeHeader = response.headers.get('Content-Type');
      if (contentTypeHeader && contentTypeHeader.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const responseEvent = new CustomEvent('response', {
        detail: { response: responseData, status: response.status, headers: response.headers }
      });
      this.dispatchEvent(responseEvent);

      console.log('Response received:', responseData);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        this.dispatchEvent(new CustomEvent('abort'));
      } else {
        console.error('Fetch error:', error);
        const errorEvent = new CustomEvent('error', {
          detail: { error: error.message }
        });
        this.dispatchEvent(errorEvent);
      }
    } finally {
      this.dispatchEvent(new CustomEvent('submitend'));
    }
  }

  mount() {
    this.addEventListener('submit', this.handleSubmit);
  }

  unmount() {
    this.removeEventListener('submit', this.handleSubmit);
    this.abortController.abort();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);
  }

  abort() {
    this.abortController.abort();
    this.abortController = new AbortController();
  }
}, { extends: 'form' });
