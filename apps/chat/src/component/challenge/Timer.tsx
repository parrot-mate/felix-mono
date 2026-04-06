import { FC, useCallback, useEffect, useRef, useState } from "react"

interface TimerProps {
  initCountdown: number // In seconds
}
export const Timer: FC<TimerProps> = ({ initCountdown }) => {
  const state = useRef({
    start: Date.now(),
    initCountdown,
  })
  const [countdown, setCountdown] = useState(initCountdown)
  const run = useCallback(() => {
    requestAnimationFrame(() => {
      const elapsed = Date.now() - state.current.start
      setCountdown(() => Math.floor(elapsed / 1000))
      // setCountdown(state.current.initCountdown - elapsed / 1000)
      // if (countdown > 0) {
      //   run()
      // }
      run()
    })
  }, [])
  useEffect(() => {
    run()
  }, [])

  const minutes = Math.floor(countdown / 60)
  const seconds = Math.floor(countdown % 60)

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 10,
        top: 20,
        right: 20,
        width: "5rem",
        height: "1rem",
        fontSize: "0.8rem",
        background: "rgba(255, 255, 255,0.95)",
        padding: "2px",
        border: "0.5px solid rgba(0,0,0,0.2)",
        textAlign: "center",
        color: `rgb(34 214 70 / 60%)`,
      }}
    >
      <span>{(minutes + "").padStart(2, "0")}</span>:
      <span>{(seconds + "").padStart(2, "0")}</span>
    </div>
  )
}
