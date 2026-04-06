export interface SafeInsets {
  top: number
  bottom: number
  left: number
  right: number
}



export async function getSafeInsets(): Promise<SafeInsets | undefined> {
  try {
    return await window.PmateBridge?.call("getSafeInsets")
  } catch {
    return undefined
  }
}
