import { sign } from "./sign"

export function verifyHash(message: string, hash: string): boolean {
  const newHash = sign(message)
  return newHash === hash
}
