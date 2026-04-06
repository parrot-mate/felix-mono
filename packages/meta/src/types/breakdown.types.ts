export interface Part {
  original: string
  translation: {
    cn: string
  }
  words: Explain[]
}

export interface Explain {
  key: string
  explain: string
}

export interface SentenceBreakDown {
  parts?: Part[]
}

export interface Keywords {
  keyword: string
  explain: string
}
export interface SentenceAnalyze {
  raw: string
  words: Keywords[]
}
