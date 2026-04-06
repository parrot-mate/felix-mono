import { useEffect } from "react"

export const Fallback = ({ name }: { name: string }) => {
  useEffect(() => {
    console.log(`Fallback ${name}`)
  }, [])
  return null
}
