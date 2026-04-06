import { VocabularyMap } from "@pmate/utils"
import { HighlightNode } from "./HighlightTree"
import { VolcabularyLog } from "@pmate/meta"

interface HighlightData {
  type: "volcabulary" | "bookmark" | "explain"
}
interface MarkerNote {
  initialText: string
  initialInnerHTML: string
}
export class Marker {
  private static markers: Map<Element, MarkerNote> = new Map()
  private static idCounter = 1
  constructor(private trie: VocabularyMap<VolcabularyLog>) {}

  setMark(p: Element) {
    const cache = Marker.markers.get(p)

    const text = cache ? cache.initialText : p.textContent || ""
    if (!text) {
      return null
    }
    if (!cache) {
      Marker.markers.set(p, {
        initialText: text,
        initialInnerHTML: p.innerHTML,
      })
      p.setAttribute("data-gptdict-paragraph", "")
    }
  }

  unmark(p: Element) {
    const cache = Marker.markers.get(p)
    if (cache) {
      p.innerHTML = cache.initialInnerHTML
    }
  }

  mark(p: Element) {
    const cache = Marker.markers.get(p)

    const text = cache ? cache.initialText : p.textContent || ""
    if (!text) {
      return null
    }
    const root = new HighlightNode<HighlightData>(text, text, false, null)

    const words = text.split(/[^A-Za-z-]+/)
    const matches = new Set<string>()
    for (const word of words) {
      if (this.trie.search(word)) {
        matches.add(word)
      }
    }
    const list = [...matches].sort((a, b) => b.length - a.length)
    for (const w of list) {
      root.insertHighlight(w, {
        type: "volcabulary",
      })
    }

    const node = this.renderHighlightNode(root)
    removeAllChildren(p)
    if (node instanceof DocumentFragment) {
      const list = [...node.childNodes]
      for (let child of list) {
        p.appendChild(child)
      }
    } else {
      p.appendChild(node)
    }
  }

  private __renderNode(node: HighlightNode<HighlightData>) {
    if (node.isHighlight) {
      const span = document.createElement("span")
      const type = node.data?.type!
      const style: any = {}
      switch (type) {
        case "bookmark":
          style.background = "#ffffe4"
          break
        case "volcabulary":
          span.setAttribute("data-gptdict-volcabulary", "")
          style.color = "#00b894"
          break
        case "explain":
          span.setAttribute("data-gptdict-explain", "")
          style["text-decoration"] = "underline"
          style["text-decoration-color"] = "#999"
          style["text-decoration-style"] = "dotted"
          break
      }
      span.setAttribute("style", styleObjectToString(style))
      return span
    } else {
      if (node.children && node.children.length > 0) {
        return document.createDocumentFragment()
      } else {
        return this.__textToFragments(node.text)
      }
    }
  }

  private __textToFragments(text: string) {
    const prts = text.split(/([^a-zA-Z-])/)
    const frag = document.createDocumentFragment()

    for (let prt of prts) {
      const span = document.createElement("span")
      span.textContent = prt
      span.classList.add("gptdict-span-clear")
      if (prt.length > 0 && prt.trim().length > 0) {
        span.classList.add("gptdict-word", Marker.idCounter++ + "")
      }
      frag.appendChild(span)
    }
    return frag
  }

  private appendExplanation(element: HTMLElement) {
    if (element.hasAttribute && element.hasAttribute("data-gptdict-explain")) {
      if (element.querySelector(".gptdict-explain-link")) {
        return
      }
      const a = document.createElement("a")
      a.classList.add("gptdict-explain-link")
      a.textContent = "[?]"
      element.appendChild(a)
    }
  }

  renderHighlightNode(node: HighlightNode<HighlightData>): Node {
    const element = this.__renderNode(node) as HTMLElement

    // If no children
    if (!node.children || node.children.length === 0) {
      if (node.isHighlight) {
        const frag = this.__textToFragments(node.text)
        const list = [...frag.childNodes]
        for (let child of list) {
          element.appendChild(child)
        }
        this.appendExplanation(element)
      }
      return element
    }

    for (let child of node.children) {
      const el = this.renderHighlightNode(child)
      element.appendChild(el)
    }
    this.appendExplanation(element)
    return element
  }
}

function styleObjectToString(style: Record<string, string>) {
  return Object.keys(style)
    .map((k: string) => {
      return `${k}:${style[k]}`
    })
    .join(";")
}

function removeAllChildren(parentNode: Node) {
  while (parentNode.firstChild) {
    parentNode.removeChild(parentNode.firstChild)
  }
}
