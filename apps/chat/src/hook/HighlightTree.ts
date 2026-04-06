export interface Highlight<T> {
  data: T
  str: string
}
export class HighlightNode<T> {
  text: string
  allText: string
  isHighlight: boolean
  data: T | null
  children: HighlightNode<T>[]

  constructor(
    text: string,
    allText: string,
    isHighlight: boolean,
    data: T | null
  ) {
    this.text = text
    this.allText = allText
    this.isHighlight = isHighlight
    this.children = []
    this.data = data
  }

  insertHighlight(highlight: string, data: T): boolean {
    if (this.isHighlight) {
      return false
    }
    if (!includeIgnoreCase(this.allText, highlight)) {
      return false
    }

    if (includeIgnoreCase(this.text, highlight)) {
      const prts = this.text.split(
        new RegExp(`((?<![a-zA-Z-])${highlight}(?![a-zA-Z-]))`, "i")
      )
      this.text = ""
      for (let prt of prts) {
        if (prt.length === 0) {
          continue
        }
        const isHighlight =
          prt.toLocaleLowerCase() === highlight.toLocaleLowerCase()

        this.children.push(
          new HighlightNode(prt, prt, isHighlight, isHighlight ? data : null)
        )
      }
      return true
    }

    for (const child of this.children) {
      if (child.insertHighlight(highlight, data)) {
        return true
      }
    }

    return false
  }

  static buildHighlightTree<T>(
    source: string,
    highlights: Highlight<T>[]
  ): HighlightNode<T> {
    const root = new HighlightNode<T>(source, source, false, null)
    highlights = highlights.sort((a, b) => b.str.length - a.str.length)
    for (const highlight of highlights) {
      root.insertHighlight(highlight.str, highlight.data)
    }
    return root
  }
}

function includeIgnoreCase(str1: string, str2: string) {
  return str1.toLocaleLowerCase().includes(str2.toLocaleLowerCase())
}

// const source = ` Some even set it away back centuries upon centuries and said that by the mental and spiritual clock it was still the Age of Belief in Austria.`

// // Example usage
// const highlights = [
//   "some even set it away back centuries upon centuries",
//   "set it away",
//   "away",
//   "mental",
//   "spiritual",
// ].map((x) => {
//   return {
//     str: x,
//     data: {
//       type: "volcabulary",
//     },
//   }
// })

// const tree = HighlightNode.buildHighlightTree(source, highlights)
// console.log(JSON.stringify(tree, null, 2))
