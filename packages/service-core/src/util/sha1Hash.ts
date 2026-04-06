import { createHash } from "crypto"

export function sha1(inputString: string) {
  // Create a SHA-1 hash of the input string
  const hash = createHash("sha1")
  hash.update(inputString)
  return hash.digest("hex") // Return the hash in hexadecimal format
}
