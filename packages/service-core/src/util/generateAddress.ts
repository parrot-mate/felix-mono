import { keccak256 } from "js-sha3"

function _generateUniqueId(): string {
  const timestamp = Date.now().toString(36) // Convert current timestamp to base-36 string
  const randomString = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    }
  )
  return `${timestamp}-${randomString}`
}

export function generateAddress(): string {
  const id = _generateUniqueId()
  const hash = keccak256(id)
  return `0x${hash}`
}
