import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

const memoryStorage = (() => {
  const data = new Map<string, string>()
  return {
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
    removeItem(key: string) {
      data.delete(key)
    },
    clear() {
      data.clear()
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: memoryStorage,
  configurable: true,
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
