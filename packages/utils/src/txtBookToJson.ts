import { sentenceTrimEN } from "@pmate/lang"
import type { Book, Chapter, LangShort } from "@pmate/meta"

export function txtToBook(title: string, txt: string, lang: LangShort = "en") {
  const book: Book = {
    name: title,
    desc: "",
    author: "",
    lang,
    chapters: [],
  }
  const tokens = parseTxt(txt)
  const chapters: Chapter[] = []
  for (let t of tokens) {
    let lastChpt = chapters[chapters.length - 1]
    if (!lastChpt) {
      chapters.push({
        title: "",
        paragraphs: [],
      })
      lastChpt = chapters[chapters.length - 1]
      if (t.type === "chapter") {
        lastChpt.title = t.content
        continue
      }
    }

    if (t.type === "chapter") {
      chapters.push({
        title: t.content,
        paragraphs: [],
      })
    } else {
      lastChpt.paragraphs.push({
        content: t.content,
        words: [],
      })
    }
  }

  book.chapters = chapters

  return book
}

interface ParagraphToken {
  content: string
  type: "content" | "chapter"
}

const chapterHeaderRegs = [
  /^\s*(Chapter|Part)\s+(\d+)\s*/i,
  /^\s*NOTE ON THE[\sA-Z]+$/,
  /^\s*(FOREWORD|PROLOGUE)[\sA-Z]*$/,
]
const splitRegs = [/\s*----[-]+\s*/]

function parseTxt(txt: string): ParagraphToken[] {
  txt = txt.replace(/\r/g, "").replace(/s*----[-]+s*/g, "")
  const paragraphs = txt.split("\n").filter((x) => sentenceTrimEN(x))
  const linesWithIndent = paragraphs.filter((x) => /^\s{2,}/.test(x)).length
  const totalLines = paragraphs.length
  const splitByIndent = linesWithIndent / totalLines > 0.1
  const tokens: ParagraphToken[] = []

  for (let p of paragraphs) {
    // If Chapter
    let isChapter = false

    for (let rule of chapterHeaderRegs) {
      if (rule.test(p)) {
        console.log(p)
        tokens.push({
          type: "chapter",
          content: p,
        })
        isChapter = true
        break
      }
    }
    if (isChapter) {
      continue
    }

    // If no meaning
    for (let rule of splitRegs) {
      if (rule.test(p)) {
        continue
      }
    }
    const lastToken = tokens[tokens.length - 1]
    if (!lastToken || lastToken.type === "chapter") {
      tokens.push({
        type: "content",
        content: p,
      })
      continue
    }

    if (splitByIndent) {
      if (p.match(/^\s{2,}/)) {
        tokens.push({
          type: "content",
          content: p,
        })
        continue
      }
      const lastToken = tokens[tokens.length - 1]
      lastToken.content += " " + p
    } else {
      // If text

      if (isFinished(lastToken.content)) {
        tokens.push({
          type: "content",
          content: p,
        })
        continue
      }
      lastToken.content += p
    }
  }
  return tokens
}

function isFinished(str: string) {
  return /[\.!.”]\s*$/.test(str)
}
