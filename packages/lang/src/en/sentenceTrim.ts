export function sentenceTrim(str: string) {
  str = str.trim()
  str = str.replace(/([A-Za-z])\s+-([A-Za-z])/g, "$1$2")
  str = str.replace(/([A-Za-z])-\s+([A-Za-z])/g, "$1$2")
  str = str.replace(/\s{2,}/g, " ")
  // str = str.replace(/\s*([^A-Za-z0-9-])\s*/g, "$1")
  return str
}
