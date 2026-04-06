// Required by React to suppress act(...) environment warnings in unit tests.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const installMemoryStorage = () => {
  const backing = new Map<string, string>()
  const storage = {
    get length() {
      return backing.size
    },
    clear() {
      backing.clear()
    },
    getItem(key: string) {
      return backing.has(key) ? backing.get(key)! : null
    },
    key(index: number) {
      return Array.from(backing.keys())[index] ?? null
    },
    removeItem(key: string) {
      backing.delete(key)
    },
    setItem(key: string, value: string) {
      backing.set(String(key), String(value))
    },
  }

  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  })
  if ("window" in globalThis) {
    Object.defineProperty(window, "localStorage", {
      value: storage,
      configurable: true,
    })
  }
}

const candidate = (globalThis as { localStorage?: { clear?: unknown } })
  .localStorage

if (!candidate || typeof candidate.clear !== "function") {
  installMemoryStorage()
}
