import { ReactNode, useCallback, useEffect, useRef } from "react"

type Props = {
  onHeightChange: (height?: number) => void
  children: (register: (node: HTMLDivElement | null) => void) => ReactNode
}

export const HeightReporter = ({ onHeightChange, children }: Props) => {
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [])

  const register = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null

      if (!node) {
        return
      }

      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            onHeightChange(entry.contentRect.height)
          }
        })
        observer.observe(node)
        observerRef.current = observer
        onHeightChange(node.getBoundingClientRect().height)
      } else {
        onHeightChange(node.getBoundingClientRect().height)
      }
    },
    [onHeightChange]
  )

  return <>{children(register)}</>
}
