const REGEXS = [
  /\*\*([a-zA-Z ]+)\*\*\s*[:：-]([^\n]*)/gs,
  /\*\*([a-zA-Z ]+)[(（]([^(（)）]*)[)）]\*\*\s*[:：-]([^\n]*)/gs,
  /\*\*([a-zA-Z ]+)\*\*\s*[(（]([^(（)）]*)[)）]\s*[:：-]([^\n]*)/gs,
  /\*\*([a-zA-Z ]+)\*\*\s*[(（]([^(（)）]*)[)）]\s*[:：-]\s*([^\n]*)/gs,
]

export const toSentenceAnalyze = (md: string | null) => {
  if (!md) return null
  for (const regex of REGEXS) {
    const matches = [...md.matchAll(regex)]
    if (matches.length > 0) {
      const M = matches
        .map((match) => {
          if (match.length === 3) {
            return {
              keyword: match[1],
              explain: match[2],
            }
          } else if (match.length === 4) {
            return {
              keyword: match[1],
              explain: `${match[2]}, ${match[3]}`,
            }
          } else {
            return null
          }
        })
        .filter((x) => x !== null)
      if (M.length > 0) {
        return M
      }
    }
  }
  return null
}
