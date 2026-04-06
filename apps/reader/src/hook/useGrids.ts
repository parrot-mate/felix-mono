import { Emitter } from "@pmate/utils"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

interface Grid {
  x: number
  y: number
  name: string
}

const GRID_CHANGED = "grid_changed"
class Container extends Emitter<string> {
  public grids: Grid[] = []
  private current: string
  constructor(
    private name: string,
    start: string
  ) {
    super()
    this.current = start
  }

  public getViewPosition(): [number, number] | null {
    const grid = this.currentGrid()
    if (!grid) {
      return null
    }
    return [grid.x, grid.y]
  }

  public switchTo(name: string) {
    this.current = name
    this.emit(GRID_CHANGED)
  }

  public addGrid(x: number, y: number, name: string) {
    if (this.grids.find((grid) => grid.name === name)) {
      return
    }
    this.grids.push({
      x,
      y,
      name,
    })
    this.emit(GRID_CHANGED)
  }

  private currentGrid() {
    return this.grids.find((grid) => grid.name === this.current)
  }
}

const containers: Map<string, Container> = new Map()

export const GridContainerContext = createContext<Container | null>(null)

export const useGrids = () => {}

export const useGridSetup = (x: number, y: number, name: string) => {
  const container = useContext(GridContainerContext)!

  container.addGrid(x, y, name)
}

export const useViewPosition = (
  container: Container
): [number, number] | null => {
  const [pos, setPos] = useState(container.getViewPosition())
  const checkPosition = useCallback(() => {
    const newPos = container.getViewPosition()
    if (JSON.stringify(newPos) === JSON.stringify(pos)) {
      return
    }
    setPos(newPos)
  }, [pos])
  useEffect(() => {
    checkPosition()
    return container.on(GRID_CHANGED, () => {
      checkPosition()
    })
  }, [pos])
  return pos
}

export const useGridContainerSetup = (name: string, start: string) => {
  if (!containers.has(name)) {
    containers.set(name, new Container(name, start))
  }
}

export const useGridContainer = (name: string) => {
  if (!containers.has(name)) {
    throw new Error(`No container named ${name}`)
  }
  return containers.get(name)!
}

export const useGridSwitch = () => {
  const container = useContext(GridContainerContext)!
  return (name: string) => container.switchTo(name)
}
