type TokenType = "word" | "punctuation"
interface Token {
  type: TokenType
  value: string
}

type MatchFunction = (
  paragraph: string,
  i: number,
  m: RegExpMatchArray
) => TokenType | "skip"
type MatchRule = {
  type: TokenType
  reg: RegExp
  func?: MatchFunction
}
const matchList: MatchRule[] = [
  {
    type: "word",
    reg: /^(Mr|Mrs|Ms|Dr|Prof|Gen)\./g,
  },
  {
    type: "word",
    reg: /^\.\s*\.\s*\./,
  },
  {
    type: "word",
    reg: /^(‘[^‘’]+’|“[^“”]+”|"[^"]+")/,
    func: (_, __, m) => {
      const matched = m[0]
      if (matched.length < 300) {
        return "word"
      }
      return "skip"
    },
  },
  {
    type: "punctuation",
    reg: /^[.]/,
    func: (paragraph, i) => {
      const before = paragraph.slice(Math.max(0, i - 10), i)
      const after = paragraph.slice(i + 1, i + 10)

      const beforeIsAbbreviation = before.match(/(Mr|Mrs|Ms|Dr|Prof|Gen)\.$/)
      const beforeIsOneBigLetter = before.match(/(\s*|[,.!?'])[A-Z]$/)
      const beforeIsNumber = before.match(/[0-9]$/)
      const afterIsNumber = after.match(/^[0-9]/)
      if (afterIsNumber && beforeIsNumber) {
      return "word"
      }
      if (beforeIsAbbreviation) {
        return "word"
      }
      if (beforeIsOneBigLetter) {
        return "word"
      }
      return "punctuation"
    },
  },
  {
    type: "punctuation",
    reg: /^(\.\s*'|\?\s*'|!\s*'|\.\s*’|\?\s*’|!\s*’|\.\s*”|\?\s*”|!\s*”)/,
  },

  {
    type: "punctuation",
    reg: /^[?!;]/,
  },
  {
    type: "punctuation",
    reg: /^[\n]/,
    func: (paragraph, i) => {
      const after = paragraph.slice(i + 1, i + 10)
      const before = paragraph.slice(Math.max(0, i - 10), i)
      if (after.match(/^\s*[A-Z]/)) {
        return "punctuation"
      }
      if (after.match(/(\d+\s*-\s*\d+|\d+\s*\.| [a-zA-Z]\s*\.)/)) {
        return "punctuation"
      }
      if (after.match(/^\s*[A-Z]/) && before.match(/[0-9]\s*$/)) {
        return "punctuation"
      }

      return "word"
    },
  },
  {
    type: "word",
    reg: /^([,;:@#$%^&*()'‘“”’])/,
  },
  {
    type: "word",
    reg: /^[a-zA-Z0-9-]+/,
  },
  {
    type: "word",
    reg: /^[ ]+/,
  },
  {
    type: "word",
    reg: /./,
  },
  {
    type: "word",
    reg: /(\r|\n|\t)/,
  },
]

function tokenizer(paragraph: string): Token[] {
  let i = 0
  const tokens: Token[] = []
  while (i < paragraph.length) {
    let match: MatchRule | null = null
    for (let j = 0; j < matchList.length; j++) {
      const rule = matchList[j]
      const reg = rule.reg
      const result = paragraph.slice(i).match(reg)

      if (result) {
        match = rule
        const value = result[0]
        const type = rule.func ? rule.func(paragraph, i, result) : rule.type
        if (type === "skip") {
          continue
        }
        tokens.push({
          type,
          value,
        })
        i += value.length
        break
      }
    }
    if (!match) {
      console.error(`Unrecognized input: ${paragraph.slice(i)}`)
      tokens.push({
        type: "word",
        value: paragraph[i++],
      })
    }
  }
  tokens.forEach((x) => (x.value = x.value.replace(/(\n|\r|\t)/g, " ")))
  return tokens
}

export function splitSentence(paragraph: string, minLen = 20): string[] {
  if (!paragraph.trim()) {
    return []
  }
  const tokens = tokenizer(paragraph)
  const sentences: string[] = []
  let sentence = ""
  for (const token of tokens) {
    if (token.type === "punctuation") {
      sentence += token.value
      sentences.push(sentence)
      sentence = ""
    } else {
      sentence += token.value
    }
  }
  if (sentence.length > 0) {
    sentences.push(sentence)
  }
  if (minLen) {
    let newList: string[] = []
    for (let s of sentences) {
      if (!newList.length) {
        newList.push(s)
        continue
      }
      const last = newList[newList.length - 1]
      if (last.length >= minLen) {
        newList.push(s)
      } else {
        newList[newList.length - 1] = last + s
      }
    }
    return newList
  }
  return sentences
}
