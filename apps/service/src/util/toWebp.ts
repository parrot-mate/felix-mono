import sharp from "sharp"
export const toWebp = (input: Buffer) => {
  return new Promise<Buffer>((resolve, reject) => {
    sharp(input)
      .webp({ quality: 70 }) // Convert to WebP
      .toBuffer() // Convert to Buffer
      .then((output) => resolve(output)) // Resolve the promise with the output Buffer
      .catch((err) => reject(err)) // Reject the promise in case of an error
  })
}
