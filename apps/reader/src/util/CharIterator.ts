export interface Char {
  char: string
  offset: number
  node: Node
}

export class CharIterator {
  private i: number
  private p: Node
  constructor(node: Node, private dir: "forward" | "backward") {
    const text = node.textContent || ""
    this.i = dir === "forward" ? text.length - 1 : 0
    this.p = node
  }

  *next(): Generator<Char> {
    const textContent = this.p.textContent || ""
    this.i = this.dir === "backward" ? this.i - 1 : this.i + 1

    switch (this.dir) {
      case "backward": {
        if (this.i >= 0) {
          yield {
            char: textContent[this.i],
            node: this.p,
            offset: this.i,
          }
          yield* this.next()
          return
        }

        const prevSpan = CharIterator.prevSpanNode(this.p)

        if (prevSpan) {
          const isBreak = prevSpan.parentNode !== this.p.parentNode

          this.p = prevSpan as Node
          this.i = this.p.textContent?.length || 0

          if (isBreak) {
            yield {
              char: "<<break>>",
              node: this.p,
              offset: this.i - 1,
            }
          } else {
            yield {
              char: " ",
              node: this.p,
              offset: this.i - 1,
            }
          }
          this.i = prevSpan.textContent?.length || 0
          yield* this.next()
        }
        break
      }
      case "forward": {
        if (this.i < textContent.length) {
          yield {
            char: textContent[this.i],
            node: this.p,
            offset: this.i,
          }
          yield* this.next()
          return
        }

        const nextSpan = CharIterator.nextSpanNode(this.p)

        if (nextSpan) {
          const isBreak = nextSpan.parentNode !== this.p.parentNode

          if (isBreak) {
            yield {
              char: "<<break>>",
              node: this.p,
              offset: this.i - 1,
            }
          } else {
            yield {
              char: " ",
              node: this.p,
              offset: this.i - 1,
            }
          }
          this.p = nextSpan as Node
          this.i = -1
          yield* this.next()
        }

        break
      }
    }
  }

  public static *traverseBackward(node: Node) {
    let n: Node | null = node
    while (n) {
      if (n !== node) {
        yield n
      }

      if (n.previousSibling) {
        n = n.previousSibling
        yield* CharIterator.traverseChildrenBackward(n)
      } else {
        n = n.parentNode
      }
    }
  }

  public static *traverseForward(node: Node) {
    let n: Node | null = node
    while (n) {
      if (n !== node) {
        yield n
      }

      if (n.nextSibling) {
        n = n.nextSibling
        yield* CharIterator.traverseChildren(n)
      } else {
        n = n.parentNode
      }
    }
  }

  public static *traverseChildren(node: Node): Generator<Node> {
    if (!node) {
      return
    }
    for (let p of node.childNodes) {
      // console.log(p)
      yield p
      yield* CharIterator.traverseChildren(p)
    }
  }

  public static *traverseChildrenBackward(node: Node): Generator<Node> {
    if (!node) {
      return
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      const p = node.childNodes[node.childNodes.length - i - 1]
      yield p
      yield* CharIterator.traverseChildren(p)
    }
  }

  public static nextSpanNode(startNode: Node) {
    let gen = CharIterator.traverseForward(startNode)

    for (let n of gen) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        if (
          (n as Element).hasAttribute("data-word-split") &&
          yClose(n as Element, startNode as Element)
        ) {
          return n
        }
      }
    }
    return null
  }

  public static prevSpanNode(startNode: Node) {
    let gen = CharIterator.traverseBackward(startNode)

    for (let n of gen) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        if (
          (n as Element).hasAttribute("data-word-split") &&
          yClose(n as Element, startNode as Element)
        ) {
          // console.log(n)
          return n
        }
      }
    }
    return null
  }
}

function yClose(a: Element, b: Element) {
  const rectA = a.getBoundingClientRect()
  const rectB = b.getBoundingClientRect()

  const distX = Math.min(
    Math.abs(rectA.x - (rectB.x + rectB.width)),
    Math.abs(rectB.x - (rectA.x + rectA.width))
  )

  const distY = Math.min(
    Math.abs(rectA.y - (rectB.y + rectB.height)),
    Math.abs(rectB.y - (rectA.y + rectA.height))
  )
  // const caseA = Math.abs(rectA.y - rectB.y) < 10 && Math.abs(rectA.x - rectB.x) < 10
  return distX < 10 || distY < 5
  // return Math.abs(rectA.y - rectB.y) < 50
}
