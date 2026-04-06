import { useEffect, useState } from "react"

export const useInstallPWA = () => {
  const [prompot, setPrompt] = useState<any | null>(null)
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e: Event) => {
      e.preventDefault()
      setPrompt(e)
    })
  })
  return prompot
}
