import { Box, BoxProps } from "@mui/material"
import { useEffect, useState } from "react"
import { format } from "date-fns/format"

export const Timer = (props: BoxProps) => {
  const [time, setTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((x) => x + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const h = Math.floor(time / 3600)
  const m = Math.floor((time % 3600) / 60)
  const s = time % 60
  const date = new Date(1970, 0, 1, h, m, s)

  const str = h > 0 ? format(date, "HH:mm:ss") : format(date, "mm:ss")
  return (
    <Box {...props}>
      <span
        style={{
          color: "#333",
          fontSize: "0.7rem",
        }}
      >
        {str}
      </span>
    </Box>
  )
}
