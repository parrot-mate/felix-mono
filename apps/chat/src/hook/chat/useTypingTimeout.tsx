import { useCallback, useEffect, useRef, useState } from "react"

// in seconds
export const useTypingTimeout = (initialTimeout: number) => {
  const [timeout, setTimeout] = useState(initialTimeout)
  const timer = useRef<NodeJS.Timeout | null>(null)

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
    setTimeout(initialTimeout)
  }, [initialTimeout])

  const start = useCallback(() => {
    stop() // clear any existing timer

    timer.current = setInterval(() => {
      setTimeout((prev) => {
        if (prev <= 1) {
          stop()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stop])

  useEffect(() => {
    return stop
  }, [stop])

  return { timeout, start, stop }
}
