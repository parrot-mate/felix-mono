import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

const storageState = new Map<string, string>()

const localStorageMock: Storage = {
  get length() {
    return storageState.size
  },
  clear() {
    storageState.clear()
  },
  getItem(key: string) {
    return storageState.has(key) ? storageState.get(key)! : null
  },
  key(index: number) {
    return [...storageState.keys()][index] ?? null
  },
  removeItem(key: string) {
    storageState.delete(key)
  },
  setItem(key: string, value: string) {
    storageState.set(key, value)
  },
}

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
})

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
})

afterEach(() => {
  cleanup()
  localStorageMock.clear()
})
