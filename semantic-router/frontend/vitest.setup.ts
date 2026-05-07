/**
 * Polyfill for ElementInternals and other browser APIs to make Web Awesome components work in JSDOM
 */

const createMockInternals = (el: any) => {
  const internals: any = {
    setFormValue: () => {},
    setValidity: () => {},
    checkValidity: () => true,
    reportValidity: () => true,
    validationMessage: '',
    willValidate: true,
    validity: {
      badInput: false,
      customError: false,
      patternMismatch: false,
      rangeOverflow: false,
      rangeUnderflow: false,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valid: true,
      valueMissing: false
    },
    form: el.closest?.('form') || null,
    labels: [],
    setCustomValidity: () => {},
    resetValidity: () => {},
    updateValidity: () => {},
    states: new Set(),
  };

  return new Proxy(internals, {
    get(target, prop) {
      if (prop === 'states') return target.states;
      if (prop === 'validity') return target.validity;
      if (typeof target[prop] === 'function') return target[prop];
      if (target[prop] !== undefined) return target[prop];
      if (typeof prop === 'string' && prop.startsWith('aria')) return '';
      return () => {};
    }
  });
};

if (typeof window !== 'undefined') {
  // ElementInternals
  const patch = function(this: any) {
    if (!this.__internals) {
      this.__internals = createMockInternals(this);
    }
    return this.__internals;
  };

  Object.defineProperty(Element.prototype, 'attachInternals', {
    value: patch,
    configurable: true,
    writable: true
  });
  
  if (typeof HTMLElement !== 'undefined') {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
      value: patch,
      configurable: true,
      writable: true
    });
  }

  (window as any).ElementInternals = class {};

  // ResizeObserver
  (window as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Global fetch mock to avoid ECONNREFUSED and provide sensible defaults
global.fetch = async (input: any) => {
  const url = typeof input === 'string' ? input : (input.url || '');
  let data: any = [];
  
  if (url.includes('/config')) {
    data = { log_level: 'default', log_retention: 30, default_llm: null };
  } else if (url.includes('/llm') || url.includes('/route') || url.includes('/logs') || url.includes('/query')) {
    data = [];
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
