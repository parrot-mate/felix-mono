import { Book, Chapter, LangShort } from "@pmate/meta"
import chardet from "chardet"
import { execFile } from "child_process"
import fs from "fs-extra"
import fetch from "node-fetch"
import os from "os"
import path from "path"
import { POSS } from "../util/alioss"
import { stripHtmlWithParser, stripMarkdown } from "../util/strips"

export const handleParse = async (params: {
  type: "text" | "mobi" | "pdf" | "epub"
  url: string
  name: string
  id: string
}) => {
  const { type, url, name, id } = params

  if (!"epub pdf mobi text".includes(type)) {
    throw new Error("unsupported type")
  }

  const ossKey = `books/${id}.json`
  const exists = await POSS.publicOSS.existsOSS(ossKey)
  const staticUrl = `https://book.skedo.cn/${ossKey}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`download failed: ${res.status}`)

  const buffer = await res.buffer()
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ebook-"))
  let markdown: string

  let lang: LangShort = "en" // default

  if (type === "text") {
    const detectedRaw = chardet.detect(buffer)
    const detected = detectedRaw?.toLowerCase()

    if (detected && !["utf-8", "ascii", "gb18030"].includes(detected)) {
      throw new Error(`Unsupported encoding: ${detectedRaw}`)
    }

    if (detected === "gb18030") {
      markdown = new TextDecoder("gb18030").decode(buffer)
    } else {
      markdown = buffer.toString("utf-8")
    }
    lang = detectLanguage(markdown)
  } else {
    const originalPath = path.join(tmpDir, `original.${type}`)
    const epubPath = path.join(tmpDir, "book.epub")

    await fs.writeFile(originalPath, buffer)

    if (type === "mobi") {
      const detectedEncoding = chardet.detect(buffer)
      const encodingOption =
        detectedEncoding === "GB18030" ? "--input-encoding=gbk" : ""

      await new Promise((resolve, reject) => {
        const args = [originalPath, epubPath]
        if (encodingOption) args.push(encodingOption)

        execFile("ebook-convert", args, (err) =>
          err ? reject(err) : resolve(null)
        )
      })
    }

    const parsedPath = type === "mobi" ? epubPath : originalPath

    markdown = await new Promise((resolve, reject) => {
      execFile(
        "pandoc",
        [parsedPath, "-t", "commonmark+hard_line_breaks"],
        { maxBuffer: 50 * 1024 * 1024 },
        (err, stdout) => (err ? reject(err) : resolve(stdout))
      )
    })
    lang = detectLanguage(markdown)
  }

  await fs.rm(tmpDir, { recursive: true, force: true })

  const book = filterEmptyChapters(markdownToBook(name, markdown, lang))
  await POSS.publicOSS.uploadJsonToOSS(ossKey, book)

  return staticUrl
}

const filterChapters = ["contents", "目录"]
function filterEmptyChapters(book: Book): Book {
  book.chapters = book.chapters.filter((chapter) => {
    if (filterChapters.includes(chapter.title.toLowerCase().trim()))
      return false

    const paragraphs = chapter.paragraphs
    const numHasContent = paragraphs.filter((x) => x.content.trim().length > 1)
    return (
      paragraphs.length > 0 && numHasContent.length / paragraphs.length >= 0.3
    )
  })
  return book
}

function markdownToBook(title: string, md: string, lang: LangShort): Book {
  const lines = md.split(/\r?\n/).map(stripHtmlWithParser).map(stripMarkdown)

  const book: Book = { name: title, desc: "", author: "", lang, chapters: [] }
  let current: Chapter = { title: "", paragraphs: [] }
  let buffer: string[] = []

  function pushParagraph() {
    if (buffer.length) {
      current.paragraphs.push({ content: buffer.join(" ").trim(), words: [] })
      buffer = []
    }
  }

  function pushChapter() {
    pushParagraph()
    if (current.title || current.paragraphs.length) book.chapters.push(current)
  }

  for (const line of lines) {
    const m = line.match(/^#+\s*(.*)/)
    if (m) {
      pushChapter()
      current = { title: m[1].trim(), paragraphs: [] }
      continue
    }
    if (line.trim()) buffer.push(line.trim())
    else pushParagraph()
  }

  pushChapter()
  return book
}

function detectLanguage(text: string): LangShort {
  const sampleText = text.slice(0, 2000)

  const zhMatches = (sampleText.match(/[\u4e00-\u9fa5]/g) || []).length
  const krMatches = (sampleText.match(/[\u3130-\u318F\uAC00-\uD7A3]/g) || [])
    .length
  const spMatches = (sampleText.match(/[áéíóúüñÁÉÍÓÚÜÑ]/g) || []).length

  const totalMatches = zhMatches + krMatches + spMatches

  if (totalMatches === 0) {
    return "en"
  }

  const zhProbability = zhMatches / totalMatches
  const krProbability = krMatches / totalMatches
  const spProbability = spMatches / totalMatches

  if (
    zhProbability > krProbability &&
    zhProbability > spProbability &&
    zhProbability > 0.1
  ) {
    return "zh-CN"
  } else if (
    krProbability > zhProbability &&
    krProbability > spProbability &&
    krProbability > 0.1
  ) {
    return "ko-KR"
  } else if (
    spProbability > zhProbability &&
    spProbability > krProbability &&
    spProbability > 0.1
  ) {
    return "es-ES"
  }

  return "en"
}
