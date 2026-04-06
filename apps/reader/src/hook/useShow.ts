import { debounce } from "lodash"
import { useEffect, useRef, useState } from "react"

export const useShowWhenScrollUp = () => {
  const scrollYRef = useRef(0)
  const [showTitleBar, setShowTitleBar] = useState(true)

  useEffect(() => {
    // Handler to update scroll position and determine visibility
    const handler = debounce(() => {
      const currentScrollY = window.scrollY
      const scrollY = scrollYRef.current

      let next = showTitleBar
      if (currentScrollY === 0) {
        next = true
      } else if (currentScrollY > scrollY) {
        next = false
      } else if (currentScrollY < scrollY) {
        next = true
      }
      if (next !== showTitleBar) {
        setShowTitleBar(next)
      }

      scrollYRef.current = currentScrollY
    }, 200)

    // Attach the scroll event listener
    document.addEventListener("scroll", handler, { passive: true })

    return () => {
      // Clean up the event listener
      document.removeEventListener("scroll", handler)
    }
  }, [showTitleBar]) // Only re-run the effect if scrollY changes
  return showTitleBar
}
