import { FC, memo, useEffect, useRef } from "react"

interface ScrollIntoViewNotifyProps {
  onScrollIntoView?: (..._: any[]) => void
  children: React.ReactNode
  id: string
}
export const ScrollIntoViewNotify: FC<ScrollIntoViewNotifyProps> = memo(
  ({ onScrollIntoView, children, id }) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (!containerRef.current || !onScrollIntoView) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              onScrollIntoView()
            }
          })
        },
        {
          root: null, // use the viewport as the container
          rootMargin: "0px",
          threshold: 0.1, // call the callback when 10% of the element is visible
        }
      )

      observer.observe(containerRef.current)

      return () => {
        observer.disconnect()
      }
    }, [])

    return <div id={id} ref={containerRef}>{children}</div>
  }
)
