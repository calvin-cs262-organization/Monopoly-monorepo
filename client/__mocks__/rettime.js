'use strict';

// CJS shim for the pure-ESM rettime package, converted from the original source.

class LensList {
  #list;
  #lens;
  constructor() {
    this.#list = [];
    this.#lens = new Map();
  }
  get [Symbol.iterator]() {
    return this.#list[Symbol.iterator].bind(this.#list);
  }
  entries() { return this.#lens.entries(); }
  get(key) { return this.#lens.get(key) || []; }
  getAll() { return this.#list.map(([, value]) => value); }
  append(key, value) {
    this.#list.push([key, value]);
    this.#openLens(key, (list) => list.push(value));
  }
  prepend(key, value) {
    this.#list.unshift([key, value]);
    this.#openLens(key, (list) => list.unshift(value));
  }
  delete(key, value) {
    if (this.size === 0) return false;
    const values = this.#lens.get(key);
    if (!values) return false;
    const index = values.indexOf(value);
    if (index === -1) return false;
    values.splice(index, 1);
    this.#list.splice(this.#list.findIndex((item) => item[0] === key && item[1] === value), 1);
    return true;
  }
  deleteAll(key) {
    if (this.size === 0) return;
    this.#list = this.#list.filter((item) => item[0] !== key);
    this.#lens.delete(key);
  }
  get size() { return this.#list.length; }
  clear() {
    if (this.size === 0) return;
    this.#list.length = 0;
    this.#lens.clear();
  }
  #openLens(key, setter) {
    setter(this.#lens.get(key) || this.#lens.set(key, []).get(key));
  }
}

const kDefaultPrevented = Symbol('kDefaultPrevented');
const kPropagationStopped = Symbol('kPropagationStopped');
const kImmediatePropagationStopped = Symbol('kImmediatePropagationStopped');

class TypedEvent extends MessageEvent {
  #returnType;
  [kDefaultPrevented];
  [kPropagationStopped];
  [kImmediatePropagationStopped];
  constructor(...args) {
    super(args[0], args[1]);
    this[kDefaultPrevented] = false;
  }
  get defaultPrevented() { return this[kDefaultPrevented]; }
  preventDefault() {
    super.preventDefault();
    this[kDefaultPrevented] = true;
  }
  stopImmediatePropagation() {
    super.stopImmediatePropagation();
    this[kImmediatePropagationStopped] = true;
  }
}

class Emitter {
  #listeners;
  #listenerOptions;
  #listenerAbortCleanups;
  #typelessListeners;
  #hookListeners;
  #hookListenerOptions;
  #hookListenerAbortCleanups;
  hooks;
  constructor() {
    this.#listeners = new LensList();
    this.#listenerOptions = new WeakMap();
    this.#listenerAbortCleanups = new WeakMap();
    this.#typelessListeners = new WeakSet();
    this.#hookListeners = new LensList();
    this.#hookListenerOptions = new WeakMap();
    this.#hookListenerAbortCleanups = new WeakMap();
    this.hooks = {
      on: (hook, callback, options) => {
        if (options?.signal?.aborted) return;
        if (options?.once) {
          const original = callback;
          const wrapper = ((...args) => { this.#deleteHookListener(hook, wrapper); return original(...args); });
          callback = wrapper;
        }
        this.#hookListeners.append(hook, callback);
        if (options) this.#hookListenerOptions.set(callback, options);
        if (options?.signal) {
          const { signal } = options;
          const onAbort = () => { this.#deleteHookListener(hook, callback); };
          signal.addEventListener('abort', onAbort, { once: true });
          this.#hookListenerAbortCleanups.set(callback, () => { signal.removeEventListener('abort', onAbort); });
        }
      },
      removeListener: (hook, callback) => { this.#deleteHookListener(hook, callback); },
    };
  }
  #deleteHookListener(hook, callback) {
    this.#hookListeners.delete(hook, callback);
    const cleanup = this.#hookListenerAbortCleanups.get(callback);
    if (cleanup) { cleanup(); this.#hookListenerAbortCleanups.delete(callback); }
  }
  #deleteListener(type, listener) {
    const removed = this.#listeners.delete(type, listener);
    const cleanup = this.#listenerAbortCleanups.get(listener);
    if (cleanup) { cleanup(); this.#listenerAbortCleanups.delete(listener); }
    return removed;
  }
  on(type, listener, options) { this.#addListener(type, listener, options); return this; }
  once(type, listener, options) { return this.on(type, listener, { ...options || {}, once: true }); }
  earlyOn(type, listener, options) { this.#addListener(type, listener, options, 'prepend'); return this; }
  earlyOnce(type, listener, options) { return this.earlyOn(type, listener, { ...options || {}, once: true }); }
  emit(event) {
    if (this.#listeners.size === 0) return false;
    const hasListeners = this.listenerCount(event.type) > 0;
    const proxiedEvent = this.#proxyEvent(event);
    for (const listener of this.#matchListeners(event.type)) {
      if (proxiedEvent.event[kPropagationStopped] != null && proxiedEvent.event[kPropagationStopped] !== this) { proxiedEvent.revoke(); return false; }
      if (proxiedEvent.event[kImmediatePropagationStopped]) break;
      this.#callListener(proxiedEvent.event, listener);
    }
    proxiedEvent.revoke();
    return hasListeners;
  }
  async emitAsPromise(event) {
    if (this.#listeners.size === 0) return [];
    const pendingListeners = [];
    const proxiedEvent = this.#proxyEvent(event);
    for (const listener of this.#matchListeners(event.type)) {
      if (proxiedEvent.event[kPropagationStopped] != null && proxiedEvent.event[kPropagationStopped] !== this) { proxiedEvent.revoke(); return []; }
      if (proxiedEvent.event[kImmediatePropagationStopped]) break;
      const returnValue = await Promise.resolve(this.#callListener(proxiedEvent.event, listener));
      if (!this.#isTypelessListener(listener)) pendingListeners.push(returnValue);
    }
    proxiedEvent.revoke();
    return Promise.allSettled(pendingListeners).then((results) => results.map((r) => r.status === 'fulfilled' ? r.value : r.reason));
  }
  *emitAsGenerator(event) {
    if (this.#listeners.size === 0) return;
    const proxiedEvent = this.#proxyEvent(event);
    for (const listener of this.#matchListeners(event.type)) {
      if (proxiedEvent.event[kPropagationStopped] != null && proxiedEvent.event[kPropagationStopped] !== this) { proxiedEvent.revoke(); return; }
      if (proxiedEvent.event[kImmediatePropagationStopped]) break;
      const returnValue = this.#callListener(proxiedEvent.event, listener);
      if (!this.#isTypelessListener(listener)) yield returnValue;
    }
    proxiedEvent.revoke();
  }
  removeListener(type, listener) {
    const options = this.#listenerOptions.get(listener);
    if (!this.#deleteListener(type, listener)) return;
    for (const hook of this.#hookListeners.get('removeListener').slice()) hook(type, listener, options);
  }
  removeAllListeners(type) {
    if (type == null) {
      for (const [listenerType, listeners] of this.#listeners.entries()) while (listeners.length > 0) this.removeListener(listenerType, listeners[0]);
      for (const [hookType, hookListener] of [...this.#hookListeners]) if (!this.#hookListenerOptions.get(hookListener)?.persist) this.#deleteHookListener(hookType, hookListener);
      return;
    }
    const listeners = this.listeners(type);
    while (listeners.length > 0) this.removeListener(type, listeners[0]);
  }
  listeners(type) {
    if (type == null) return this.#listeners.getAll();
    return this.#listeners.get(type);
  }
  listenerCount(type) {
    if (type == null) return this.#listeners.size;
    return this.listeners(type).length;
  }
  #addListener(type, listener, options, insertMode = 'append') {
    if (options?.signal?.aborted) return;
    for (const hook of this.#hookListeners.get('newListener').slice()) hook(type, listener, options);
    if (type === '*') this.#typelessListeners.add(listener);
    if (insertMode === 'prepend') this.#listeners.prepend(type, listener);
    else this.#listeners.append(type, listener);
    if (options) {
      this.#listenerOptions.set(listener, options);
      if (options.signal) {
        const { signal } = options;
        const onAbort = () => { this.removeListener(type, listener); };
        signal.addEventListener('abort', onAbort, { once: true });
        this.#listenerAbortCleanups.set(listener, () => { signal.removeEventListener('abort', onAbort); });
      }
    }
  }
  #proxyEvent(event) {
    const { stopPropagation } = event;
    event.stopPropagation = () => { event[kPropagationStopped] = this; stopPropagation.call(event); };
    return { event, revoke() { event.stopPropagation = stopPropagation; } };
  }
  #callListener(event, listener) {
    for (const hook of this.#hookListeners.get('beforeEmit').slice()) if (hook(event) === false) return;
    const returnValue = listener.call(this, event);
    const options = this.#listenerOptions.get(listener);
    if (options?.once) {
      const type = this.#isTypelessListener(listener) ? '*' : event.type;
      if (this.#deleteListener(type, listener)) for (const hook of this.#hookListeners.get('removeListener').slice()) hook(type, listener, options);
    }
    return returnValue;
  }
  *#matchListeners(type) {
    const snapshot = [];
    for (const [key, listener] of this.#listeners) if (key === '*' || key === type) snapshot.push(listener);
    yield* snapshot;
  }
  #isTypelessListener(listener) { return this.#typelessListeners.has(listener); }
}

module.exports = { Emitter, TypedEvent, LensList };
