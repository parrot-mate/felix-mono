import { useEffect, useRef } from "react"

export const useSplashScreen = () => {
  const splashScreenRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Get the splash screen element
    splashScreenRef.current = document.getElementById(
      "splash-screen"
    ) as HTMLDivElement
  }, [])

  const closeSplashScreen = (delay: number = 200) => {
    setTimeout(() => {
      const splashScreen =
        splashScreenRef.current || document.getElementById("splash-screen")
      if (splashScreen) {
        splashScreen.classList.add("hidden")

        // Remove from DOM after fade out
        setTimeout(() => {
          splashScreen.remove()
        }, 600) // Match the CSS transition duration
      }
    }, delay)
  }

  const isSplashScreenVisible = () => {
    const splashScreen =
      splashScreenRef.current || document.getElementById("splash-screen")
    return splashScreen && !splashScreen.classList.contains("hidden")
  }

  return {
    closeSplashScreen,
    isSplashScreenVisible,
  }
}
