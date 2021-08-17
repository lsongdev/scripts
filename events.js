export class EventEmitter {
  constructor() {
    this.removeAllListener();
    return this;
  }
  on = this.addListener
  off = this.removeListener
  once(eventName, listener) {
    return this.addListener(eventName, function fn() {
      this.removeListener(eventName, fn);
      listener.apply(this, arguments);
    });
  }
  emit(eventName) {
    const args = [].slice.call(arguments, 1);
    const listeners = this.events[eventName] || [];
    listeners.forEach(listener => listener.apply(this, args));
    return this;
  }
  addListener(eventName, listener) {
    (this.events[eventName] = this.events[eventName] || []).push(listener);
    return () => this.removeListener(eventName, listener);
  }
  removeListener(eventName, listener) {
    const listeners = this.events[eventName] || [];
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
    return this;
  }
  removeAllListener() {
    this.events = {};
    return this;
  }
}

export const events = new EventEmitter();
export const on = events.addListener.bind(events);
export const off = events.removeListener.bind(events);
export default EventEmitter

export function throttle(func, throttleDelay) {
  let lastFunc
  let lastRan
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function () {
        if ((Date.now() - lastRan) >= throttleDelay) {
          func.apply(context, args)
          lastRan = Date.now()
        }
      }, throttleDelay - (Date.now() - lastRan))
    }
  }
};

export function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args)
    }, delay);
  }
}

export const visibilityChange = fn => {
  var hidden, visibilityChange;
  if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }
  return document.addEventListener(visibilityChange, e => fn && fn(document[hidden], e))
};
