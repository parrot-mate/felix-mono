import { Slide } from "@mui/material"
import React, { ReactElement, ReactNode, useEffect, useState } from "react"

export const DelayedSlider = ({
  children,
  delay,
  direction,
}: {
  children: ReactElement
  delay: number
  direction?: "left" | "right" | "up" | "down"
}) => {
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    setTimeout(() => {
      setChecked(true)
    }, delay)
  }, [])
  return (
    <Slide in={checked} timeout={800} direction={direction}>
      {children}
    </Slide>
  )
}

export const SlideGroup = ({ children }: { children: ReactNode }) => {
  const arr = React.Children.toArray(children) as ReactElement[]

  return (
    <>
      {arr.map((child, i) => {
        return (
          <Slide in={true} timeout={800} key={i}>
            {child}
          </Slide>
        )
      })}
    </>
  )
}
