import { useState, useEffect, useRef, useCallback } from "react"

interface UseCountdownProps {
  initialSeconds: number
  onCompleted?: () => void
}

export const useCountdown = ({
  initialSeconds,
  onCompleted,
}: UseCountdownProps) => {
  const [seconds, setSeconds] = useState(initialSeconds)
  const timerId = useRef<NodeJS.Timeout | null>(null)

  const clearTimer = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current)
    }
  }, [])

  const start = useCallback(() => {
    clearTimer()
    setSeconds(initialSeconds)
    timerId.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 1) {
          clearTimer()
          if (onCompleted) {
            onCompleted()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [initialSeconds, onCompleted, clearTimer])

  const stop = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    setSeconds(initialSeconds)
  }, [initialSeconds, clearTimer])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return { seconds, start, stop, reset }
}
