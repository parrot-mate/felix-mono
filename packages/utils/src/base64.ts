export async function hashBase64(base64: string) {
  base64 = base64.toString().split(",")[1]
  const buffer = convertBase64ToArrayBuffer(base64)
  const hash = await crypto.subtle.digest("SHA-256", buffer)
  const hexHash = bufferToHex(hash)
  return hexHash
}

function convertBase64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64) // Decode base64
  const length = binaryString.length
  const bytes = new Uint8Array(length)

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes.buffer
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Str = reader.result as string
      resolve(base64Str.split(",")[1])
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(blob)
  })
}
