export function chunkByCondition<T>(
  arr: T[],
  condition: (chunk: T[], item: T, index: number, array: T[]) => boolean
): T[][] {
  return arr.reduce((chunks: T[][], item: T, index: number, array: T[]) => {
    const lastChunk = chunks[chunks.length - 1]
    if (!lastChunk || condition(lastChunk, item, index, array)) {
      chunks.push([item])
    } else {
      lastChunk.push(item)
    }
    return chunks
  }, [])
}
