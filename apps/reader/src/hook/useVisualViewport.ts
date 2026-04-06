import { useEffect, useState } from "react"

export const useVisualViewport = () => {
  const [viewport, setViewport] = useState<VisualViewport | null>(null)

  useEffect(() => {
    const handle = () => {
      setViewport(window.visualViewport)
    }
    if (typeof window.visualViewport !== "undefined") {
      setViewport(window.visualViewport)
      window.visualViewport!.addEventListener("resize", handle)
    }
    return () => {
      if (typeof window.visualViewport !== "undefined") {
        window.visualViewport!.removeEventListener("resize", handle)
      }
    }
  }, [])

  return viewport
}
