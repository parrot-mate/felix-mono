import { useCallback, useEffect, useRef, useState } from "react"
import classes from "./Titlebar.module.scss"
import { debounce } from "lodash"

const useEvent = <K extends keyof DocumentEventMap>(
  type: K,
  handler: (this: Document, ev: DocumentEventMap[K]) => any,
  deps: any[]
) => {
  useEffect(() => {
    document.addEventListener(type, handler)
    return () => {
      document.removeEventListener(type, handler)
    }
  }, [handler, ...deps])
}

export const TitleBarContainer = ({
  children,
}: {
  children: React.ReactNode
  alwaysVisible?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0) // Track the last scroll position
  const lock = useRef(false)

  // const handleScroll = useCallback(
  //   debounce(() => {
  //     if (ref.current) {
  //       if (lock.current) return
  //       const scrollY = document.documentElement.scrollTop
  //       if (scrollY > lastScrollY.current) {
  //         // Scrolling down
  //         if (isVisible === true) {
  //           setIsVisible(false) // Hide title bar
  //         }
  //       } else {
  //         // Scrolling up
  //         if (isVisible === false) {
  //           setIsVisible(true) // Show title bar
  //         }
  //       }
  //       lastScrollY.current = scrollY // Update last scroll position
  //     }
  //   }, 2000),
  //   [isVisible]
  // )
  // useEvent(
  //   "scroll",
  //   () => {
  //     if (alwaysVisible) {
  //       return
  //     }
  //     handleScroll()
  //   },
  //   [isVisible]
  // )

  const handleCancel = () => {
    lock.current = false
  }

  return (
    <div
      ref={ref}
      className="flex items-center justify-between"
      onTouchStart={() => {
        lock.current = true
      }}
      onTouchCancel={handleCancel}
      onTouchEnd={handleCancel}
      style={{
        boxShadow: isVisible
          ? "1px 2px 5px #f2f2f2"
          : "1px 2px 3px rgba(0,0,0,0)",
        transform: isVisible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s ease-in-out",
      }}
    >
      {children}
    </div>
  )
}
