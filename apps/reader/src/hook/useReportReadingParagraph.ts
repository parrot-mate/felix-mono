import { MAX_READING_SPEED_SEC, MIN_READING_SPEED_SEC } from "@pmate/meta"
import { ReadingBook, ReadingParagraph } from "@pmate/meta"
import { Emitter, Logger } from "@pmate/utils"
import { throttle } from "lodash"
import { useEffect, useMemo, useRef } from "react"

interface PState {
  topEntered: boolean
  bottomEntered: boolean
  time: [number, number]
  t: number
}

const logger = Logger.getDebugger("useReportReadingParagraph")
class Reporter extends Emitter<string> {
  private finished: boolean[] = []
  private pStats: Record<number, PState> = {}
  private paragraphs: Record<number, ReadingParagraph> = {}

  constructor(book: ReadingBook) {
    super()
    this.updateParagraphs(book)
  }

  private getState(pid: number) {
    if (!this.pStats[pid]) {
      this.pStats[pid] = {
        topEntered: false,
        bottomEntered: false,
        t: 0,
        time: [0, 0],
      }
    }
    return this.pStats[pid]!
  }

  topEnter(pid: number) {
    if (this.finished[pid]) {
      return
    }
    const state = this.getState(pid)
    if (state.topEntered) {
      return
    }
    state.topEntered = true
    state.time = [Date.now(), 0]
    // logger.log(`${pid} top enter @${state.time}`)
  }

  bottomEnter(pid: number) {
    logger.log("bottom enter", pid, this.finished[pid])
    if (this.finished[pid]) {
      return
    }
    const state = this.getState(pid)
    state.bottomEntered = true
  }

  leave(pid: number) {
    if (this.finished[pid]) {
      return
    }
    const state = this.getState(pid)
    state.bottomEntered = false
    state.topEntered = false
  }

  updateParagraphs(book: ReadingBook) {
    this.paragraphs = {}
    for (let p of book.paragraphs) {
      this.paragraphs[p.index] = p
    }
  }

  record = () => {
    const pids = Object.keys(this.pStats)
    pids.sort()

    for (let j = 0; j < pids.length; j++) {
      const i = parseInt(pids[j])
      if (this.finished[i]) {
        continue
      }
      const state = this.getState(i)
      const p = this.paragraphs[i]
      if (state.topEntered || state.bottomEntered) {
        state.t += 1
      }

      const min = Math.ceil(p.words.length / MAX_READING_SPEED_SEC)
      if (state.t > min && state.bottomEntered) {
        this.finished[i] = true
        if (!state.time[0]) {
          state.time[0] = Date.now() - min * 1000
        }
        state.time[1] = Date.now()
        if (
          state.time[1] - state.time[0] >
          (p.words.length / MIN_READING_SPEED_SEC) * 1000
        ) {
          state.time[1] =
            state.time[0] + (p.words.length / MIN_READING_SPEED_SEC) * 1000
        }

        this.emit("finish", {
          pid: i,
          time: state.time,
        })
      }
    }
  }
}

const useUserActionRecorder = (recorder: Reporter) => {
  const lastActionTimeRef = useRef(Date.now())

  const handleUserAction = useMemo(
    () =>
      throttle(() => {
        lastActionTimeRef.current = Date.now()
      }, 5000),
    []
  )

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastActionTimeRef.current < 10000) {
        recorder.record()
      }
    }, 1000)

    const events = [
      "click",
      "scroll",
      "touchstart",
      "mousemove",
      "mousedown",
      "wheel",
      "keydown",
      "touchmove",
      "touchend",
    ]

    events.forEach((event) => window.addEventListener(event, handleUserAction))

    return () => {
      clearInterval(interval)
      events.forEach((event) =>
        window.removeEventListener(event, handleUserAction)
      )
      handleUserAction.cancel() // Cancel any pending throttled calls
    }
  }, [recorder, handleUserAction])

  return null // or any JSX if needed
}

export const useReportReadingParagraph = (
  book: ReadingBook,
  options: {
    onFinish: (pid: number, time: [number, number]) => void
    onTick: (vSet: Set<number>) => void
  }
) => {
  const recorder = useMemo(() => {
    return new Reporter(book)
  }, [book])

  useEffect(() => {
    const sub = recorder.on(
      "finish",
      ({ pid, time }: { pid: number; time: [number, number] }) => {
        options.onFinish(pid, time)
      }
    )
    return sub
  }, [recorder, options.onFinish])

  useUserActionRecorder(recorder)

  const topEnter = (pid: number) => {
    recorder.topEnter(pid)
  }
  const leave = (pid: number) => {
    recorder.leave(pid)
  }
  const bottomEnter = (pid: number) => {
    recorder.bottomEnter(pid)
  }

  return { topEnter, bottomEnter, leave }
}
