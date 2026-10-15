import '@testing-library/jest-dom';

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true,
});

// Also define on globalThis for Node 22 compatibility
Object.defineProperty(globalThis, 'localStorage', {
  value: window.localStorage,
  writable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: window.sessionStorage,
  writable: true,
});
