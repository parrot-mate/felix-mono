import { Parser } from "htmlparser2"
export function stripHtmlWithParser(html: string): string {
  let text = ""
  const parser = new Parser(
    {
      ontext(chunk) {
        text += chunk
      },
      onend() {
        // parser done
      },
    },
    { decodeEntities: true }
  )
  parser.write(html)
  parser.end()
  return text
}

export function stripMarkdown(input: string): string {
  return (
    input
      // remove links and images
      .replace(/!?\[[^\]]*\]\([^)]*\)/g, "")
      // collapse any leftover multiple spaces
      .replace(/\s{2,}/g, " ")
      .replace(/\\([\[\]*])/g, "$1")
      // trim leading/trailing whitespace
      .trim()
  )
}
