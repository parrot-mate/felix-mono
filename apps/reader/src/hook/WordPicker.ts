import { debounce } from "lodash"
import { useEffect, useMemo, useState } from "react"
import { SelectionHelper, isWordV4, Emitter } from "@pmate/utils"

interface WordPickerDataV1 {
  word: string
}

enum State {
  IDLE,
  SELECTING,
  SELECTED,
}

class WordPickerV1 extends Emitter<string> {
  private state = State.IDLE
  private I: any
  private startX?: number
  private startY?: number
  private X?: number
  private Y?: number
  constructor() {
    super()
    document.addEventListener("touchstart", this.hanldeTouchStart)
    document.addEventListener("touchmove", this.handleTouchMove)
    document.addEventListener("touchend", this.handleTouchEnd)
  }

  private initState() {
    this.startX = undefined
    this.startY = undefined
    this.X = undefined
    this.Y = undefined
    this.state = State.IDLE
    if (this.I) {
      clearTimeout(this.I)
      delete this.I
    }
  }

  private findWordElement(target: HTMLElement) {
    const isWord = target.classList.contains("gptdict-word")
    if (isWord) {
      return target
    }
    const parentWord = SelectionHelper.findParent(target, (x) => {
      if (x.classList.contains("gptdict-word")) {
        return true
      }
      return false
    })
    return parentWord
  }

  hanldeTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement
    const touches = e.touches
    if (e.touches.length !== 1) {
      return
    }
    const wordElement = this.findWordElement(target)
    if (!wordElement) {
      return
    }

    this.startX = e.touches[0].clientX
    this.startY = e.touches[0].clientY
    const word = (wordElement.textContent || "").trim()
    if (!word) {
      return
    }
    if (!isWordV4(word)) {
      return
    }

    this.I = setTimeout(() => {
      if (this.state === State.SELECTING) {
        this.emit("pick", word)
      }
    }, 500)
    this.state = State.SELECTING
  }

  handleTouchMove = debounce((e: TouchEvent) => {
    if (this.state !== State.SELECTING || e.touches.length !== 1) {
      this.initState()
      return
    }

    this.X = e.touches[0].clientX
    this.Y = e.touches[0].clientY
  }, 200)

  handleTouchEnd = (e: TouchEvent) => {
    if (this.state !== State.SELECTING || e.touches.length !== 1) {
      this.initState()
      return
    }

    if (this.X && this.Y && this.startX && this.startY) {
      const distance = Math.sqrt(
        (this.X - this.startX) ** 2 + (this.Y - this.startY) ** 2
      )
      if (distance > 10) {
        this.initState()
      }
    }
  }
}

interface WordPickerStateV1 {
  state: "idle" | "selecting" | "selected"
  word: string
  paragraph: string
}
export const useWordPickerV1 = () => {
  const [state, setState] = useState<WordPickerStateV1>({
    state: "idle",
    word: "",
    paragraph: "",
  })
  const picker = useMemo(() => {
    return new WordPickerV1()
  }, [])

  useEffect(() => {
    const unsub = picker.on("pick", (word: string) => {
      setState({
        state: "selected",
        word,
        paragraph: window.getSelection()?.toString() || "",
      })
    })

    return unsub
  }, [picker])
}

function getParagraphText() {}
