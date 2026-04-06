import { Logger } from "@pmate/utils"
import { Box, SxProps } from "@mui/material"
import React, { useEffect, useRef } from "react"

interface VisibilityCheckerProps {
  children: React.ReactNode
  onTopEnter: () => void
  onBottomEnter: () => void
  onLeave: () => void
  topCheckCondition?: (rect: DOMRect) => boolean
  bottomCheckCondition?: (rect: DOMRect) => boolean
  sx?: SxProps
}

const logger = Logger.getDebugger("VisibilityChecker")

const bottomCheckCondition = (rect: DOMRect) =>
  rect.bottom >= 0 && rect.bottom <= window.innerHeight * 0.3
export const VisibilityChecker: React.FC<VisibilityCheckerProps> = ({
  children,
  onTopEnter,
  sx,
  onBottomEnter,
  onLeave,
  topCheckCondition = (rect) => rect.top >= 0 && rect.top <= window.innerHeight,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkInitialVisibility = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        if (topCheckCondition(rect)) {
          onTopEnter()
        }
        if (bottomCheckCondition(rect)) {
          onBottomEnter()
        }
      }
    }

    checkInitialVisibility()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect

          if (entry.isIntersecting) {
            if (topCheckCondition(rect)) {
              onTopEnter()
            }
          } else {
            onLeave()
          }
        })
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: [0], // Adjust threshold values if necessary
      }
    )

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current)
    }

    return () => {
      if (wrapperRef.current) {
        observer.unobserve(wrapperRef.current)
      }
    }
  }, [
    onTopEnter,
    onBottomEnter,
    onLeave,
    topCheckCondition,
    bottomCheckCondition,
  ])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect

          if (entry.isIntersecting) {
            logger.log("here--", rect, entry.target)
            if (rect.bottom >= 0) {
              onBottomEnter()
            }
          }
        })
      },
      {
        root: null,
        rootMargin: "0% 0px -70% 0px",
        threshold: [0], // Adjust threshold values if necessary
      }
    )
    if (bottomRef.current) {
      observer.observe(bottomRef.current)
    }

    return () => {
      if (bottomRef.current) {
        observer.unobserve(bottomRef.current)
      }
    }
  }, [
    onTopEnter,
    onBottomEnter,
    onLeave,
    topCheckCondition,
    bottomCheckCondition,
  ])

  return (
    <Box ref={wrapperRef} sx={sx}>
      {children}
      <div
        style={{
          width: "100%",
          height: "1px",
          // background: "red",
        }}
        ref={bottomRef}
      ></div>
    </Box>
  )
}
