export interface ClickedAreaInfo {
  word: string
  phrases: string[]
  sentence: string
}

const TagsShouldRemove = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "NOSCRIPT",
  "A",
  "IMG",
  "SVG",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "VIDEO",
  "AUDIO",
  "CANVAS",
  "EMBED",
  "OBJECT",
  "SOURCE",
  "TRACK",
  "MAP",
  "AREA",
  "MATH",
  "DEL",
  "INS",
  "FORM",
  "FRAME",
  "FRAMESET",
  "NOFRAMES",
  "APPLET",
  "BASE",
  "BASEFONT",
  "BGSOUND",
  "HEAD",
  "LINK",
  "CODE",
])
export class SelectionHelper {
  public static isMarkedParagraph(element: Element) {
    return element.hasAttribute("data-gptdict-paragraph")
  }

  public static isValidSelectionArea(p: Element) {
    if (hasCodingChild(p as HTMLElement)) {
      return false
    }

    if (p.hasAttribute("data-gptdict-paragraph")) {
      return true
    }

    if (["H1", "H2", "H3", "H4", "H5", "P"].includes(p.tagName)) {
      return true
    }

    if (!hasDirectChildTextNode(p)) {
      return false
    }

    if (!validTextContent(p, p.textContent || "")) {
      return false
    }
    return true
  }

  public static *findAllTextNodes(node: Node): IterableIterator<Node> {
    if (
      node.childNodes.length === 1 &&
      node.childNodes[0].nodeType === Node.TEXT_NODE
    ) {
      yield node
    }

    for (let i = 0; i < node.childNodes.length; i++) {
      yield* SelectionHelper.findAllTextNodes(node.childNodes[i])
    }
  }

  public static isParagraph(element: Element): boolean {
    if (!element || !element.hasAttribute) {
      return false
    }
    return element.hasAttribute("data-gptdict-paragraph")
  }

  public static getParagraph(element: Node): Element | null {
    return SelectionHelper.findParent(element, (x) => {
      return x.hasAttribute("data-gptdict-paragraph")
    })
  }

  public static getTextIncludingElements(
    firstEl: Element,
    secondEl: Element
  ): string {
    const p = SelectionHelper.findParent(firstEl, (x) => {
      return x.hasAttribute("data-gptdict-paragraph")
    })
    if (!p) {
      return ""
    }
    const allNodes = [...SelectionHelper.findAllTextNodes(p)]
    const x = allNodes.findIndex((x) => x === firstEl)
    const y = allNodes.findIndex((x) => x === secondEl)

    const relatedNodes = allNodes.slice(x > y ? y : x, x > y ? x + 1 : y + 1)
    const text = relatedNodes.map((x) => x.textContent).join("")
    return text
  }

  public static findParent(element: Node, predicate: (e: Element) => boolean) {
    let parent = element.parentElement
    while (parent) {
      if (predicate(parent)) {
        return parent
      }
      parent = parent.parentElement
    }
    return null
  }

  public static findParagraph(element: Node) {
    const parent = SelectionHelper.findParent(element, (x) => {
      return x.hasAttribute("data-gptdict-paragraph")
    })

    return parent?.textContent || ""
  }

  public static findSentence(element: Node, text: string): string | null {
    const parent = SelectionHelper.findParent(element, (x) => {
      return x.hasAttribute("data-gptdict-paragraph")
    })
    if (!text) {
      return null
    }
    if (parent === null) {
      return null
    }
    // Extract the text content from the parent element
    let fullText: string = parent.textContent || ""
    fullText = fullText.replace(/\[\?\]/g, "")

    // Find the position of the span's text within the parent element's text
    // const spanText: string = element.textContent || element.innerText
    const spanStartIndex: number = fullText.indexOf(text)
    if (spanStartIndex === -1) {
      return null // Span text not found in parent
    }

    // Split the parent's text into sentences
    const sentences: string[] = splitLines(fullText)

    // Find the sentence that contains the span's text
    for (const sentence of sentences) {
      const sentenceStartIndex: number = fullText.indexOf(sentence)
      const sentenceEndIndex: number = sentenceStartIndex + sentence.length

      if (
        spanStartIndex >= sentenceStartIndex &&
        spanStartIndex < sentenceEndIndex
      ) {
        return sentence
      }
    }

    return null
  }

  public static visibleHtags() {
    const htags = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5")
    ).filter((h) => {
      const textLength = (h.textContent || "").length
      if (textLength < 10) {
        return false
      }
      if (!isElementVisible(h)) {
        return false
      }
      const aParent = SelectionHelper.findParent(h, (x) => {
        return x.tagName === "A"
      })
      if (aParent) {
        return false
      }

      const linksTextLength = Array.from(h.querySelectorAll("a")).reduce(
        (total, link) => total + (link.textContent || "").length,
        0
      )
      // Exclude the child if text inside <a> tags exceeds the text outside
      return textLength - linksTextLength >= linksTextLength
    })
    return htags
  }
  public static findVisibleParagraph(prop: string = "data-gptdict-paragraph") {
    const paras = [...document.querySelectorAll(`[${prop}]`)]

    return paras.filter((x) => isElementVisible(x))
  }

  public static findElementsWithTextInViewPort() {
    const paragraph = findH1AndPunctuationNodes(document.body)
    const inGPTRoot = (x: Element) =>
      !!SelectionHelper.findParent(x, (x) => {
        return x.id === "gptdic-root"
      })

    return paragraph
      .filter((x) => {
        return isElementVisible(x)
      })
      .filter((x) => !x.classList.contains("gptdict-word"))
      .filter((x) => !inGPTRoot(x))
  }

  public static findElementsWithText() {
    const paragraph = findH1AndPunctuationNodes(document.body)
    const inGPTRoot = (x: Element) =>
      !!SelectionHelper.findParent(x, (x) => {
        return x.id === "gptdic-root"
      })

    return paragraph
      .filter((x) => !x.classList.contains("gptdict-word"))
      .filter((x) => !inGPTRoot(x))
  }

  public static findScroller(element: HTMLElement) {
    let scroller: HTMLElement = document.documentElement
    let parent: HTMLElement | null = element.parentElement

    while (parent !== null) {
      if (
        parent.tagName === "DIV" &&
        parent.scrollHeight > parent.clientHeight
      ) {
        scroller = parent
        break
      }
      parent = parent.parentElement
    }
    return scroller
  }

  public static findScrollDiff(element: HTMLElement) {
    // Calculate the top position of the element relative to the viewport
    const elementRect = element.getBoundingClientRect()
    const elementTopViewport = elementRect.top

    // Calculate the desired top position at 20% of the viewport height
    const viewportHeight = window.innerHeight
    const targetTopPosition = viewportHeight * 0.2

    // Calculate the difference to scroll
    const scrollDiff = elementTopViewport - targetTopPosition
    return scrollDiff
  }

  public static scrollTop20PDF(element: HTMLElement): void {
    const scroller = document.body
    const scrollDiff = SelectionHelper.findScrollDiff(element)

    if (scrollDiff < 0) {
      return
    }

    // Perform the scroll
    requestAnimationFrame(() => {
      if (scroller === document.documentElement || scroller === document.body) {
        // smoothScrollBy(scrollDiff, 1000)
        window.scrollBy({ top: scrollDiff, behavior: "smooth" })
        // window.scrollBy({ top: scrollDif, behavior: "instant" })
      } else {
        ;(scroller as HTMLElement).scrollBy({
          top: scrollDiff,
          behavior: "smooth",
        })
      }
    })
  }

  public static scrollTop20(element: HTMLElement): void {
    const scroller = SelectionHelper.findScroller(element)
    const scrollDiff = SelectionHelper.findScrollDiff(element)

    if (scrollDiff < 0) {
      return
    }

    // Perform the scroll
    requestAnimationFrame(() => {
      if (scroller === document.documentElement || scroller === document.body) {
        // smoothScrollBy(scrollDiff, 1000)
        window.scrollBy({ top: scrollDiff, behavior: "smooth" })
        // window.scrollBy({ top: scrollDif, behavior: "instant" })
      } else {
        ;(scroller as HTMLElement).scrollBy({
          top: scrollDiff,
          behavior: "smooth",
        })
      }
    })
  }
}

function hasCodingChild(p: HTMLElement) {
  return (
    p.querySelectorAll("code").length > 0 ||
    p.querySelectorAll("script").length > 0
  )
}

function splitLines(text: string): Array<string> {
  // First, handle the quoted text
  const quotedTextRegex = /"[^"]+"|'[^']+'/g
  let match: any
  const quotes: string[] = []

  // Extract quoted text and replace it with placeholders
  while ((match = quotedTextRegex.exec(text)) !== null) {
    // @ts-ignore
    quotes.push(match[0])
    text = text.replace(match[0], `<<${quotes.length - 1}>>`)
  }

  // Now, split the text by the specified punctuation marks
  const splitText = text.split(/(?<=[.?!])\s+/)

  // Replace the placeholders with the original quoted text
  for (let i = 0; i < splitText.length; i++) {
    splitText[i] = splitText[i].replace(
      /<<(\d+)>>/g,
      (_, index) => quotes[Number(index)]
    )
  }

  return splitText
}

function hasDirectChildTextNode(element: Element): boolean {
  // Ensure the element is provided and is a valid DOM element
  if (!element) {
    console.error("Invalid or no element provided")
    return false
  }

  // Iterate through child nodes
  for (let i = 0; i < element.childNodes.length; i++) {
    let child = element.childNodes[i]

    // Check if the child is a text node
    if (
      child.nodeType === Node.TEXT_NODE &&
      (child.textContent || "").trim().length > 0
    ) {
      return true
    }
  }
  // No text node found
  return false
}

function validTextContent(p: Element, content: string) {
  if (!content) {
    return false
  }

  if (["P", "H1", "H2", "H3", "H4", "H5"].includes(p.tagName)) {
    return true
  }

  return hasPunctuation(content) && content.length > 50
}

export function isElementVisible(p: Element) {
  const rect = p.getBoundingClientRect()
  const H = -200
  const B = (window.innerHeight || document.documentElement.clientHeight) + 200
  const topVisible = rect.top >= H && rect.top <= B
  const bottomVisible = rect.bottom >= H && rect.bottom <= B
  return topVisible || bottomVisible
}

function hasDirectTextNodeChild(el: Element) {
  return Array.from(el.childNodes).some(
    (node) =>
      node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim() !== ""
  )
}

function hasPunctuation(sentence: string) {
  // Regular expression that matches common punctuation marks
  const punctuationRegex = /[\.,\?!;:\-\“\”\‘\’'"]/
  return punctuationRegex.test(sentence)
}

function findH1AndPunctuationNodes(root: Element) {
  // Skip if this node is an ancestor of a previously found node
  const queue: Element[] = [root]
  const elements: Element[] = []
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    if (TagsShouldRemove.has(current.tagName)) {
      continue
    }

    const anyParent = SelectionHelper.findParent(current, (x) => {
      return TagsShouldRemove.has(x.tagName)
    })
    if (anyParent) {
      continue
    }

    if (current.nodeType === Node.ELEMENT_NODE) {
      if (current.tagName === "H1") {
        elements.push(current)
        continue
      }
      const currentText = (current.textContent || "").trim()
      if (
        hasDirectTextNodeChild(current) &&
        hasPunctuation(currentText) &&
        currentText.split(" ").length > 5
      ) {
        elements.push(current)
        continue
      }
      Array.from(current.children).forEach((child) => queue.push(child))
    }
  }
  return elements
}
