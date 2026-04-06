export function wordSpliter(str: string): string[] {
  const result: string[] = []
  let token = ""
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (/\s/.test(ch) || /[.,!?]/.test(ch)) {
      if (token) {
        result.push(token)
        token = ""
      }
      if (!/\s/.test(ch)) {
        result.push(ch)
      }
    } else {
      token += ch
    }
  }
  if (token) {
    result.push(token)
  }
  return result
}

export function isReadable(word: string) {
  return /[\u3130-\u318F\uAC00-\uD7A3]/.test(word)
}
