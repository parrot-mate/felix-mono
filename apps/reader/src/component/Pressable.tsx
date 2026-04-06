import React, {
  forwardRef,
  ReactNode,
  TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

interface PressableProps {
  onShortPress?: () => void
  onLongPress?: () => void
  onPressChange?: (isPressing: boolean) => void
  threshold?: number
  className?: string
  children: ReactNode
  style?: React.CSSProperties
  pressingColor?: string
  as?: "span" | "div"
}

const MOVE_THRESHOLD = 1
export const Pressable = forwardRef<HTMLElement, PressableProps>(
  (
    {
      onShortPress,
      onLongPress,
      onPressChange,
      threshold = 1100,
      children,
      className,
      style,
      pressingColor = "rgba(0, 0, 0, 0.15)",
      as,
    },
    ref
  ) => {
    const pressTimeoutRef = useRef<number | null>(null)
    const pressStartTimeRef = useRef<number | null>(null)
    const initialTouchRef = useRef<{ x: number; y: number } | null>(null)
    const [isPressing, setIsPressing] = useState(false)
    const [isLongPress, setIsLongPress] = useState(false)

    const MIN_PRESS_DURATION = 20 // Minimum press duration for a short press

    const startPress = useCallback(
      (x?: number, y?: number) => {
        setIsPressing(true)
        setIsLongPress(false)

        // Record start time
        pressStartTimeRef.current = Date.now()

        // Store initial touch point if available
        if (x !== undefined && y !== undefined) {
          initialTouchRef.current = { x, y }
        } else {
          initialTouchRef.current = null
        }

        if (pressTimeoutRef.current) {
          clearTimeout(pressTimeoutRef.current)
        }

        // Start the long press timeout
        pressTimeoutRef.current = window.setTimeout(() => {
          setIsLongPress(true)
          if (onLongPress) onLongPress()
        }, threshold)
      },
      [threshold, onLongPress]
    )

    useEffect(() => {
      onPressChange && onPressChange(isPressing)
    }, [isPressing])

    const endPress = useCallback(() => {
      setIsPressing(false)
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current)
        pressTimeoutRef.current = null
      }

      const pressDuration = pressStartTimeRef.current
        ? Date.now() - pressStartTimeRef.current
        : 0

      // Only trigger onShortPress if user pressed at least MIN_PRESS_DURATION and it's not a long press
      if (
        !isLongPress &&
        onShortPress &&
        pressDuration >= MIN_PRESS_DURATION &&
        isPressing
      ) {
        onShortPress()
      }
    }, [isLongPress, onShortPress, isPressing])

    const cancelPress = useCallback(() => {
      setIsPressing(false)
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current)
        pressTimeoutRef.current = null
      }
    }, [])

    const handleMouseDown = useCallback(() => {
      startPress()
    }, [startPress])

    const handleMouseUp = useCallback(() => {
      endPress()
    }, [endPress])

    const handleMouseLeave = useCallback(() => {
      cancelPress()
    }, [cancelPress])

    const handleTouchStart = useCallback(
      (e: TouchEvent<HTMLSpanElement>) => {
        const touch = e.touches[0]
        startPress(touch.pageX, touch.pageY)
      },
      [startPress]
    )

    const handleTouchEnd = useCallback(() => {
      endPress()
    }, [endPress])

    const handleTouchCancel = useCallback(() => {
      cancelPress()
    }, [cancelPress])

    const handleTouchMove = useCallback(
      (e: TouchEvent<HTMLSpanElement>) => {
        if (!initialTouchRef.current) return

        const touch = e.touches[0]
        const dx = Math.abs(touch.pageX - initialTouchRef.current.x)
        const dy = Math.abs(touch.pageY - initialTouchRef.current.y)

        // If movement exceeds threshold, consider it a scroll and cancel the press
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          cancelPress()
        }
      },
      [threshold, cancelPress]
    )

    return React.createElement(as || "span", {
      ref,
      className,
      style: {
        transition: isPressing ? "background-color 1.5s ease" : "none",
        ...style,
        backgroundColor: isPressing ? pressingColor : style?.backgroundColor,
      },
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchCancel: handleTouchCancel,
      children,
    })
  }
)
