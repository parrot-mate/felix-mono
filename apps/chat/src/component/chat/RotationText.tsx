import { useEffect, useState } from "react"

interface RotationTextProps {
  texts: string[]
  className?: string
}

export const RotationText = ({ texts, className = "" }: RotationTextProps) => {
  const [textIndex, setTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [usedIndices, setUsedIndices] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      
      setTimeout(() => {
        setUsedIndices((prevUsed) => {
          const currentIndex = textIndex
          const newUsed = [...prevUsed, currentIndex]
          
          // If all indices have been used, reset the used list
          if (newUsed.length >= texts.length) {
            setTextIndex(() => {
              const availableIndices = texts
                .map((_, index) => index)
                .filter(index => index !== currentIndex)
              return availableIndices[Math.floor(Math.random() * availableIndices.length)]
            })
            return [currentIndex]
          }
          
          // Find available indices (not in usedIndices)
          const availableIndices = texts
            .map((_, index) => index)
            .filter(index => !newUsed.includes(index))
          
          setTextIndex(() => {
            return availableIndices[Math.floor(Math.random() * availableIndices.length)]
          })
          
          return newUsed
        })
        setIsVisible(true)
      }, 300) // Half of the fade duration
    }, 1500)

    return () => clearInterval(interval)
  }, [textIndex, texts])

  return (
    <div 
      className={`transition-opacity duration-600 ease-in-out ${className}`}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {texts[textIndex]}
    </div>
  )
}

