import { last } from "lodash"

export function chunkByCondition<T>(
  arr: T[],
  condition: (chunk: T[], item: T, index: number, array: T[]) => boolean
): T[][] {
  return arr.reduce((chunks: T[][], item: T, index: number, array: T[]) => {
    let lastChunk = last(chunks)
    if (!lastChunk || condition(lastChunk, item, index, array)) {
      chunks.push([item])
    } else {
      lastChunk.push(item)
    }
    return chunks
  }, [])
}
