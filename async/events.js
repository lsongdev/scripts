
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
