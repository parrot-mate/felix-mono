export function wordSpliter(str: string): string[] {
  return str
    .replace(/\s+/g, '')
    .split('')
    .filter((x) => x)
}
export function isReadable(word: string) {
  return /[\u4e00-\u9fa5]/.test(word)
}
