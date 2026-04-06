import { debounce, tap } from "lodash"
import { useCallback, useRef, TouchEvent } from "react"

export const useDoubleTap = (onDoubleTap: () => void) => {
  const tapCount = useRef(0)
  const posX = useRef(0)
  const posY = useRef(0)

  const reset = useCallback(
    debounce(() => {
      tapCount.current = 0
    }, 300),

    []
  )

  const onStart = useCallback((e: TouchEvent<any>) => {
    const x = e.touches[0].clientX
    const y = e.touches[0].clientY
    if (tapCount.current === 0) {
      posX.current = x
      posY.current = y
      tapCount.current++
    } else if (tapCount.current === 1) {
      const distance = Math.sqrt(
        (x - posX.current) ** 2 + (y - posY.current) ** 2
      )
      if (distance > 20) {
        tapCount.current = 0
      } else {
        tapCount.current++
      }
    }

    reset()
  }, [])

  const onEnd = useCallback(() => {
    if (tapCount.current === 2) {
      onDoubleTap()
      tapCount.current = 0
    }
  }, [])

  return { onStart, onEnd }
}
