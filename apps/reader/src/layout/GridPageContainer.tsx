import { ReactNode, useEffect, useRef, useState } from "react"
import classes from "./GridPage.module.scss"
import {
  GridContainerContext,
  useGridContainer,
  useGridContainerSetup,
  useViewPosition,
} from "@/hook/useGrids"

function getStyle(pos: [number, number] | null) {
  if (!pos) {
    return {
      opacity: 0,
    }
  }
  const [x, y] = pos
  return {
    transform: `translate3d(-${x * 100}%, -${y * 100}%, 0)`,
    opacity: 1,
  }
}

export const GridPageContainer = ({
  children,
  start,
  name,
}: {
  children: ReactNode
  start: string
  name: string
}) => {
  useGridContainerSetup(name, start)
  const container = useGridContainer(name)
  const _pos = useViewPosition(container)
  const [pos, setPos] = useState<[number, number] | null>(_pos)
  const style = getStyle(pos)
  const [transition, setTransition] = useState("")

  useEffect(() => {
    if (JSON.stringify(_pos) !== JSON.stringify(pos)) {
      if (pos) {
        setTransition("transform 0.5s ease-out")
        requestAnimationFrame(() => {
          setPos(_pos)
          requestAnimationFrame(() => {
            setTimeout(() => {
              setTransition("")
            }, 500)
          })
        })
      } else {
        setPos(_pos)
      }
    }
  }, [_pos])

  return (
    <GridContainerContext.Provider value={container}>
      <div className={classes.GridPageContainer}>
        <div
          style={{ ...style, height: window.innerHeight, transition }}
          className={classes.GridPageScroller}
        >
          {children}
        </div>
      </div>
    </GridContainerContext.Provider>
  )
}
