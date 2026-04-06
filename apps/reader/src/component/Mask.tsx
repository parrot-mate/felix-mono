import { useEffect, useMemo, useRef } from "react"
import classes from "../reader/Reader.module.scss"
export const Mask = ({
  onClick,
  zIndex,
  opacity = 0.5,
  stopScroll = false,
}: {
  onClick: () => void
  zIndex?: number
  stopScroll: boolean
  opacity?: number
}) => {
  const lock = useRef(true)
  useEffect(() => {
    if (stopScroll) {
      document.body.style.overflow = "hidden"
    }
    setTimeout(() => {
      lock.current = false
    }, 1000)
    return () => {
      if (stopScroll) {
        document.body.style.overflow = "auto"
      }
    }
  }, [])
  return (
    <div
      style={{
        zIndex: zIndex || 2,
        opacity,
      }}
      onClick={() => {
        if (lock.current) {
          return
        }
        onClick()
      }}
      className={classes.Mask}
    ></div>
  )
}
