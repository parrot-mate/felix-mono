import { useGridSetup } from "@/hook/useGrids"
import classes from "./GridPage.module.scss"
import { FC, ReactNode, useEffect, useState } from "react"

interface GridPageProps {
  children: ReactNode
  x: number
  y: number
  name: string
}
export const GridPage: FC<GridPageProps> = ({ children, x, y, name }) => {
  useGridSetup(x, y, name)

  return (
    <div
      data-scroller
      className={classes.GridPage}
      style={{
        transform: `translate(${100 * x}%, ${100 * y}%)`,
      }}
    >
      {children}
    </div>
  )
}
