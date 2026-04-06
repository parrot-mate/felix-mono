import { Logger } from "@pmate/utils"
import {
  ReactNode,
  UIEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { HeightReporter } from "./HeightReporter"
import type { EntryState } from "./VList"
import { Entry, VList } from "./VList"

export type VirtualizedState = EntryState

const DEFAULT_OVERSCAN = 200

const logger = Logger.getDebugger("VirtualizedList")
type VirtualizedListProps<T> = {
  data: T[]
  resolveKey: (item: T, index: number) => string
  renderItem: (
    item: T,
    context: { index: number; state: VirtualizedState }
  ) => ReactNode
  className?: string
  topContent?: ReactNode
  bottomContent?: ReactNode
  onScroll?: (event: UIEvent<HTMLDivElement>) => void
}

export const VirtualizedList = <T,>({
  data,
  resolveKey,
  renderItem,
  className,
  topContent,
  bottomContent,
  onScroll,
}: VirtualizedListProps<T>) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pendingViewportRef = useRef<{
    scrollTop: number
    clientHeight: number
  } | null>(null)
  const frameRequestRef = useRef<number | null>(null)
  const initialScrollPerformedRef = useRef(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => {
    const list = new VList<T>(DEFAULT_OVERSCAN)
    list.renew(data, resolveKey)
    return list
  }, [])
  const [revision, setRevision] = useState(0)

  useLayoutEffect(() => {
    list.renew(data, resolveKey)
  }, [data, resolveKey, list])

  useEffect(() => {
    const unsubscribe = list.onChange(() => {
      setRevision((value) => value + 1)
    })
    return unsubscribe
  }, [list])

  const virtualizationReady = list.areAllMeasured()

  const evaluateViewport = useCallback(() => {
    if (!list.areAllMeasured()) {
      return
    }
    const element = containerRef.current
    if (!element) {
      return
    }
    list.computeViewportState(element.scrollTop, element.clientHeight)
  }, [list])

  useEffect(() => {
    evaluateViewport()
  }, [evaluateViewport, revision])

  useEffect(() => {
    const element = containerRef.current
    if (!element || typeof ResizeObserver === "undefined") {
      return
    }
    const observer = new ResizeObserver(() => {
      evaluateViewport()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [evaluateViewport])

  const updateViewportState = useCallback(
    (scrollTop: number, clientHeight: number) => {
      if (!list.areAllMeasured()) {
        return
      }
      pendingViewportRef.current = { scrollTop, clientHeight }
      if (frameRequestRef.current !== null) {
        return
      }
      frameRequestRef.current = window.requestAnimationFrame(() => {
        frameRequestRef.current = null
        const pending = pendingViewportRef.current
        pendingViewportRef.current = null
        if (!pending) {
          return
        }
        list.computeViewportState(pending.scrollTop, pending.clientHeight)
      })
    },
    [list]
  )

  useEffect(() => {
    return () => {
      if (frameRequestRef.current !== null) {
        window.cancelAnimationFrame(frameRequestRef.current)
      }
    }
  }, [])

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (virtualizationReady) {
        const element = event.currentTarget
        updateViewportState(element.scrollTop, element.clientHeight)
      }
      onScroll?.(event)
    },
    [onScroll, updateViewportState, virtualizationReady]
  )

  const handleHeightChange = useCallback(
    (entry: Entry<T>, height?: number) => {
      if (entry.updateHeight(height)) {
        list.notifyChange()
      }
    },
    [list]
  )

  const entries = list.getEntries()
  useEffect(() => {
    if (entries.length === 0) {
      return
    }
    if (initialScrollPerformedRef.current || !virtualizationReady) {
      return
    }
    const element = containerRef.current
    if (!element) {
      return
    }
    logger.log(
      "VirtualizedList: Performing initial scroll to bottom",
      virtualizationReady,
      entries.length
    )
    requestAnimationFrame(() => {
      const target = containerRef.current
      if (!target) {
        return
      }
      initialScrollPerformedRef.current = true
      logger.log(target.children[0].clientHeight)
      target.scrollTop = target.scrollHeight
      updateViewportState(target.scrollTop, target.clientHeight)
    })
  }, [updateViewportState, virtualizationReady, entries])

  const shouldVirtualize = virtualizationReady
  logger.log("entries update", entries)

  return (
    <div ref={containerRef} className={className} onScroll={handleScroll}>
      {topContent}
      {entries.map((entry) => {
        const showContent =
          !shouldVirtualize || !entry.isFirstRendered || entry.inViewPort()
        return (
          <HeightReporter
            key={entry.key}
            onHeightChange={(height) => handleHeightChange(entry, height)}
          >
            {(register) => (
              <div ref={register}>
                {showContent ? (
                  renderItem(entry.item, { index: entry.index, state: entry })
                ) : (
                  <div
                    style={{
                      height: entry.height ?? VList.DEFAULT_HEIGHT_FALLBACK,
                    }}
                  />
                )}
              </div>
            )}
          </HeightReporter>
        )
      })}
      {bottomContent}
    </div>
  )
}
