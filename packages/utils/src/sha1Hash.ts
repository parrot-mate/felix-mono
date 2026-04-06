export async function calculateSHA1Hash(sentence: string) {
  sentence = sentence.trim()
  // Convert the JSON array to a Uint8Array
  const encoder = new TextEncoder()
  const data = encoder.encode(sentence)

  // Calculate the SHA-1 hash
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)

  // Convert the hash to a hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  return hashHex
}

export async function fileSha1(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-1", arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}
