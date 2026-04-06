import { gzip } from "pako"

type Compressible =
  | Blob
  | ArrayBuffer
  | ArrayBufferView

/**
 * Compresses the provided binary payload with gzip and returns the compressed bytes.
 * Accepts Blob for browser callers alongside common array buffer types.
 */
export async function gzipEncodeBlob(input: Compressible): Promise<Uint8Array> {
  const array = await toUint8Array(input)
  return gzip(array)
}

async function toUint8Array(input: Compressible): Promise<Uint8Array> {
  if (input instanceof Uint8Array) {
    return input
  }

  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(
      input.buffer,
      input.byteOffset,
      input.byteLength
    )
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input)
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    const buf = await input.arrayBuffer()
    return new Uint8Array(buf)
  }

  throw new TypeError("Unsupported input type for gzipEncodeBlob")
}
