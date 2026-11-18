import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

const createStorageMock = () => {
  let storage = new Map();

  return {
    get length() {
      return storage.size;
    },
    clear: () => {
      storage = new Map();
    },
    getItem: (key) => {
      const normalizedKey = String(key);
      return storage.has(normalizedKey) ? storage.get(normalizedKey) : null;
    },
    key: (index) => Array.from(storage.keys())[index] ?? null,
    removeItem: (key) => {
      storage.delete(String(key));
    },
    setItem: (key, value) => {
      storage.set(String(key), String(value));
    },
  };
};

const ensureStorage = (name) => {
  const candidate = window[name];
  if (
    candidate &&
    typeof candidate.clear === "function" &&
    typeof candidate.getItem === "function" &&
    typeof candidate.setItem === "function" &&
    typeof candidate.removeItem === "function"
  ) {
    return;
  }

  Object.defineProperty(window, name, {
    configurable: true,
    value: createStorageMock(),
  });
};

ensureStorage("localStorage");
ensureStorage("sessionStorage");

beforeEach(() => {
  ensureStorage("localStorage");
  ensureStorage("sessionStorage");
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});
