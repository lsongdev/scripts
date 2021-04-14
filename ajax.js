/**
 * [Ajax description]
 * @param {[type]} options [description]
 */
function Ajax(options) {
  if (!(this instanceof Ajax))
    return new Ajax(options);
  this.xhr = new XMLHttpRequest();
  return this;
};

/**
 * [READY_STATE description]
 * @type {Object}
 */
Ajax.READY_STATE = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4
};

/**
 * [STATUS_CODE description]
 * @type {Object}
 */
Ajax.STATUS_CODE = {
  OK: 200,
  REDIRECT: 300,
  NOT_MODIFIED: 304
};
/**
 * [function description]
 * @param  {[type]} url [description]
 * @return {[type]}     [description]
 */
Ajax.prototype.get = function (url) {
  this.url = url;
  this.method = 'get';
  return this;
};

/**
 * [function description]
 * @param  {[type]} url [description]
 * @return {[type]}     [description]
 */
Ajax.prototype.post = function (url) {
  this.url = url;
  this.method = 'post';
  return this;
};

/**
 * [function description]
 * @param  {[type]} name  [description]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
Ajax.prototype.header = function (name, value) {
  if (arguments.length === 1) {
    this.xhr.getResponseHeader(name);
  } else {
    this.xhr.setRequestHeader(name, value);
  }
  return this;
};

/**
 * [function description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
Ajax.prototype.send = function (name, value) {
  if (typeof name === 'object') {
    this.data = name;
  } else {
    this.data[name] = value;
  }
  return this;
};
/**
 * [query description]
 * @param  {[type]} name  [description]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
Ajax.prototype.query = function (name, value) {
  if (typeof name === 'object') {
    this.query = name;
  } else {
    this.query[name] = value;
  }
  return this;
};
/**
 * [function description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Ajax.prototype.end = function (callback) {
  this.xhr.open(this.method, this.url, this.async);
  this.xhr.onreadystatechange = function () {
    if (this.readyState == Ajax.READY_STATE.DONE) {
      if (this.status >= Ajax.STATUS_CODE.OK &&
        this.status < Ajax.STATUS_CODE.REDIRECT ||
        this.status == Ajax.STATUS_CODE.NOT_MODIFIED) {
        return callback(null, new Ajax.Response(this));
      }
      callback && callback(this);
    }
  };
  this.xhr.send(this.data);
  return this;
};

/**
 * [Response description]
 * @param {[type]} xhr [description]
 */
Ajax.Response = function (xhr) {
  this.xhr = xhr;
  this.status = xhr.status;
  this.statusText = xhr.statusText;
  return this;
};
/**
 * [header description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
Ajax.Response.prototype.header = function (name) {
  return this.xhr.getResponseHeader(name);
};
/**
 * [headers]
 */
Ajax.Response.prototype.__defineGetter__('headers', function () {
  return (this.xhr.getAllResponseHeaders() || '')
    .split(/\r\n/)
    .filter(Boolean)
    .reduce(function (headers, header) {
      var p = header.split(/:\s?/);
      headers[p[0]] = p[1];
      return headers;
    }, {})
})
/**
 * [body]
 */
Ajax.Response.prototype.__defineGetter__('body', function () {
  var contentType = this.header('Content-Type');
  var body, type = this.xhr.responseType || ({
    'application/json': 'json'
  })[contentType.split(/;\s?/)[0]];
  switch (type) {
    case 'json':
      body = JSON.parse(this.xhr.response);
      break;
    case 'text':
      body = this.xhr.responseText;
      break;
    case 'xml':
      body = this.xhr.responseXML;
      break;
    case 'html':
      body = document
        .createElement('iframe')
        .innerHTML = this.xhr.response;
      break;
    default:
      body = this.xhr.response;
      break;
  }
  return body;
});


export default Ajax;
