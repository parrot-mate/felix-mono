import { calculateSHA1Hash } from "@pmate/utils"
import { useCallback, useEffect, useState } from "react"

export const useSha1 = (text: string) => {
  const [sha1, setSha1] = useState("")
  const calc = useCallback(async () => {
    const hash = await calculateSHA1Hash(text)
    setSha1(hash)
  }, [text])

  useEffect(() => {
    calc()
  }, [text])

  return sha1
}
