import { Paragraph } from "@pmate/meta"
import { SelectionHelper } from "@pmate/utils"
import { last } from "lodash"

function* traverseNodes(node: Node, includes: string[]): Generator<Node> {
  if (includes.includes(node.nodeName.toLowerCase())) {
    yield node
    return
  }

  for (let child = node.firstChild; child; child = child.nextSibling) {
    yield* traverseNodes(child, includes)
  }
}

function filter(paragraphs: string[]) {
  return paragraphs
    .map((x) => x.trim())
    .filter((x) => {
      if (x.match(/^\[.*\]$/)) {
        return ""
      }
      return x
    })
    .filter((x) => x)
}

function getTextBetweenElements(
  doc: Document,
  elStart: HTMLElement | null,
  elEnd: HTMLElement | null
): Paragraph[] {
  let paragraphs: Paragraph[] = []

  // const excludeParent = ["a", "table", "h1", "h2", "h3", "head"]
  // const set = new Set<string>()
  for (let node of traverseNodes(doc.documentElement, [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "img",
  ])) {
    if (node === elStart || node.contains(elStart)) {
      paragraphs = []
    }
    if (node === elEnd || node.contains(elEnd)) {
      return paragraphs
    }

    if (node.nodeName.toLowerCase() === "p") {
      const text = (node.textContent || "").trim()
      if (text.match(/^\[.*\]$/)) {
        continue
      }
      // const links = [...traverseNodes(node, ["a"])].filter((x: any) => {
      //   if (x.href) {
      //     console.log(x.href)
      //   }
      //   return !x.href.match(/^http/)
      // })

      const p = last(paragraphs)
      if (p && !p.content) {
        p.content = text
      } else {
        paragraphs.push({
          content: text,
          words: [],
          resources: [],
        })
      }
    }
    if (node.nodeName.toLowerCase() === "img") {
      const img = node as HTMLImageElement
      let p = last(paragraphs)
      if (!p) {
        p = {
          content: "",
          words: [],
          resources: [],
        }
        paragraphs.push(p)
      }
      const m = img.outerHTML.match(/src=['"]([^'"]*)['"]/)
      if (m && m[1]) {
        p.resources?.push({
          type: "image",
          uri: m[1],
        })
      }
    }
  }
  return paragraphs.filter((x) => x.content)
}

export function takeTextBetween(
  html: string,
  startId: string | null | undefined,
  endId: string | null | undefined
) {
  const doc = new DOMParser().parseFromString(html, "application/xml")
  const elStart = startId ? doc.getElementById(startId) : null
  const elEnd = endId ? doc.getElementById(endId) : null
  const paragraphs = getTextBetweenElements(doc, elStart, elEnd)
  return paragraphs
}
