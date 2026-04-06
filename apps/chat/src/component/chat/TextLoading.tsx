import { useEffect, useState } from "react"

export const TextLoading = () => {
  const [t, setT] = useState(0)

  useEffect(() => {
    const I = setInterval(() => {
      setT((t) => t + 1)
    }, 1000)

    return () => {
      clearInterval(I)
    }
  }, [])

  return ".".repeat(t % 3)
}
