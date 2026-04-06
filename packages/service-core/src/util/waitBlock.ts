const BLOCK_TIME = 1_500 // 1.5s
export async function waitBlock(n: number) {
  const durationMs = Math.max(0, Math.floor(BLOCK_TIME * n))
  if (durationMs === 0) return
  await new Promise<void>((resolve) => setTimeout(resolve, durationMs))
}
