import type { GrammarTree, SyntaxNode } from "@pmate/meta"
import clsx from "clsx"
import type { HierarchyPointLink, HierarchyPointNode } from "d3"
import { hierarchy, tree } from "d3"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import type { PromptRendererSharedProps } from "./types"

const DEFAULT_MARGIN = { top: 40, right: 48, bottom: 40, left: 72 }
const COMPACT_MARGIN = { top: 32, right: 32, bottom: 32, left: 48 }

type SegmentVariant = "text" | "note"

type SegmentLine = {
  value: string
  variant: SegmentVariant
}

type LayoutConfig = {
  nodeVerticalSpacing: number
  nodeHorizontalSpacing: number
  boxWidth: number
  lineHeight: number
  boxPaddingX: number
  boxPaddingY: number
  gapX: number
  gapY: number
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeVerticalSpacing: 120,
  nodeHorizontalSpacing: 220,
  boxWidth: 220,
  lineHeight: 18,
  boxPaddingX: 28,
  boxPaddingY: 18,
  gapX: 56,
  gapY: 28,
}

const COMPACT_LAYOUT_CONFIG: LayoutConfig = {
  nodeVerticalSpacing: 96,
  nodeHorizontalSpacing: 180,
  boxWidth: 200,
  lineHeight: 16,
  boxPaddingX: 24,
  boxPaddingY: 16,
  gapX: 44,
  gapY: 24,
}

const MIN_NODE_HORIZONTAL_SPACING = 120
const MIN_VIEWBOX_WIDTH = 320
const MAX_BOX_WIDTH = 480

const SEGMENT_CHAR_WIDTH: Record<SegmentVariant, number> = {
  text: 7.4,
  note: 6.6,
}

type GrammarHierarchyNode = HierarchyPointNode<SyntaxNode>

type GrammarHierarchyLink = HierarchyPointLink<SyntaxNode>

type GrammarRenderNode = {
  node: GrammarHierarchyNode
  lines: SegmentLine[]
  boxHeight: number
}

type GrammarLayout = {
  nodes: GrammarRenderNode[]
  links: GrammarHierarchyLink[]
  width: number
  height: number
  xOffset: number
  margin: typeof DEFAULT_MARGIN
  config: LayoutConfig
  isCompact: boolean
}

export interface PromptGrammarRendererProps extends PromptRendererSharedProps {
  result: GrammarTree
}

const getMaxDepth = (node: SyntaxNode | undefined | null): number => {
  if (!node) return 0
  if (!node.children || node.children.length === 0) {
    return 0
  }

  return (
    1 +
    node.children.reduce((maxDepth, child) => {
      return Math.max(maxDepth, getMaxDepth(child))
    }, 0)
  )
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const estimateTextWidth = (
  value: string,
  variant: SegmentVariant,
  isCompact: boolean
) => {
  if (!value) return 0
  const baseWidth = SEGMENT_CHAR_WIDTH[variant] ?? SEGMENT_CHAR_WIDTH.text
  const scale = isCompact ? 0.9 : 1
  return value.length * baseWidth * scale
}

const getNodeSegments = (
  node: SyntaxNode | undefined | null
): Array<{ value: string; variant: SegmentVariant }> => {
  if (!node) return []

  const segments: Array<{ value: string; variant: SegmentVariant }> = []

  const addSegment = (
    value: string | undefined | null,
    variant: SegmentVariant
  ) => {
    if (!value) return
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return
    }
    segments.push({
      value: trimmed,
      variant,
    })
  }

  addSegment(node.text, "text")
  addSegment(node.note, "note")

  return segments
}

const getMaxSegmentWidth = (
  node: SyntaxNode | undefined | null,
  isCompact: boolean
): number => {
  if (!node) return 0

  const nodeWidth = getNodeSegments(node).reduce((maxWidth, segment) => {
    return Math.max(
      maxWidth,
      estimateTextWidth(segment.value, segment.variant, isCompact)
    )
  }, 0)

  if (!node.children?.length) {
    return nodeWidth
  }

  return node.children.reduce((maxWidth, child) => {
    return Math.max(maxWidth, getMaxSegmentWidth(child, isCompact))
  }, nodeWidth)
}

const splitLongWord = (word: string, maxChars: number) => {
  const parts: string[] = []
  for (let index = 0; index < word.length; index += maxChars) {
    parts.push(word.slice(index, index + maxChars))
  }
  return parts
}

const wrapSegmentValue = (
  value: string,
  variant: SegmentVariant,
  config: LayoutConfig,
  isCompact: boolean
): SegmentLine[] => {
  if (!value) {
    return []
  }

  const contentWidth = Math.max(
    1,
    Math.floor(config.boxWidth - config.boxPaddingX * 2)
  )

  const charWidth =
    (SEGMENT_CHAR_WIDTH[variant] ?? SEGMENT_CHAR_WIDTH.text) *
    (isCompact ? 0.9 : 1)

  const maxCharsPerLine = Math.max(1, Math.floor(contentWidth / charWidth))

  const lines: SegmentLine[] = []
  const rawBlocks = value.split(/\r?\n/)

  rawBlocks.forEach((block, blockIndex) => {
    const words = block.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      if (blockIndex > 0) {
        lines.push({ value: "", variant })
      }
      return
    }

    let currentLine = ""
    words.forEach((word) => {
      const candidate =
        currentLine.length === 0 ? word : `${currentLine} ${word}`
      if (candidate.length <= maxCharsPerLine) {
        currentLine = candidate
        return
      }

      if (currentLine.length > 0) {
        lines.push({ value: currentLine, variant })
        currentLine = ""
      }

      if (word.length <= maxCharsPerLine) {
        currentLine = word
        return
      }

      const wordChunks = splitLongWord(word, maxCharsPerLine)
      wordChunks.slice(0, -1).forEach((chunk) => {
        lines.push({ value: chunk, variant })
      })
      currentLine = wordChunks[wordChunks.length - 1] ?? ""
    })

    if (currentLine.length > 0) {
      lines.push({ value: currentLine, variant })
    }
  })

  if (lines.length === 0) {
    return [{ value, variant }]
  }

  return lines
}

const wrapNodeSegments = (
  node: SyntaxNode,
  config: LayoutConfig,
  isCompact: boolean
): SegmentLine[] => {
  return getNodeSegments(node).flatMap((segment) =>
    wrapSegmentValue(segment.value, segment.variant, config, isCompact)
  )
}

const getMaxLineCount = (
  node: SyntaxNode | undefined | null,
  config: LayoutConfig,
  isCompact: boolean
): number => {
  if (!node) {
    return 0
  }

  const lineCount = Math.max(
    wrapNodeSegments(node, config, isCompact).length,
    1
  )

  if (!node.children?.length) {
    return lineCount
  }

  return node.children.reduce((maxLines, child) => {
    return Math.max(maxLines, getMaxLineCount(child, config, isCompact))
  }, lineCount)
}

const getDisplayLines = (
  node: SyntaxNode,
  config: LayoutConfig,
  isCompact: boolean
): SegmentLine[] => {
  const wrapped = wrapNodeSegments(node, config, isCompact)
  if (wrapped.length > 0) {
    return wrapped
  }

  const fallbackValue =
    (node.text ?? "").trim() || (node.note ?? "").trim() || ""

  if (fallbackValue.length > 0) {
    return wrapSegmentValue(fallbackValue, "text", config, isCompact)
  }

  return [{ value: "", variant: "text" }]
}

const buildLayout = (
  result: GrammarTree | undefined | null,
  containerWidth?: number
): GrammarLayout | null => {
  if (!result?.root) {
    return null
  }

  const useCompactLayout =
    typeof containerWidth === "number" &&
    containerWidth > 0 &&
    containerWidth < 640

  const margin = useCompactLayout ? COMPACT_MARGIN : DEFAULT_MARGIN
  const baseConfig = useCompactLayout
    ? { ...COMPACT_LAYOUT_CONFIG }
    : { ...DEFAULT_LAYOUT_CONFIG }

  const maxSegmentWidth = getMaxSegmentWidth(result.root, useCompactLayout)

  const boxWidth = clamp(
    maxSegmentWidth + baseConfig.boxPaddingX * 2,
    baseConfig.boxWidth,
    MAX_BOX_WIDTH
  )

  const layoutConfig: LayoutConfig = {
    ...baseConfig,
    boxWidth,
  }

  const depth = getMaxDepth(result.root)
  const availableWidth =
    typeof containerWidth === "number" && containerWidth > 0
      ? Math.max(
          containerWidth - (margin.left + margin.right),
          MIN_NODE_HORIZONTAL_SPACING
        )
      : undefined

  const maxLineCount = getMaxLineCount(
    result.root,
    layoutConfig,
    useCompactLayout
  )
  const estimatedMaxBoxHeight =
    maxLineCount * layoutConfig.lineHeight + layoutConfig.boxPaddingY

  const minVerticalSpacing = Math.max(
    layoutConfig.nodeVerticalSpacing,
    estimatedMaxBoxHeight + layoutConfig.gapY
  )

  const minHorizontalSpacing = Math.max(
    layoutConfig.boxWidth + layoutConfig.gapX,
    MIN_NODE_HORIZONTAL_SPACING
  )

  let horizontalSpacing = Math.max(
    layoutConfig.nodeHorizontalSpacing,
    minHorizontalSpacing
  )

  if (availableWidth) {
    const compressedSpacing = availableWidth / Math.max(1, depth)
    if (compressedSpacing > horizontalSpacing) {
      horizontalSpacing = compressedSpacing
    }
  }

  layoutConfig.nodeHorizontalSpacing = Math.max(
    horizontalSpacing,
    minHorizontalSpacing
  )
  layoutConfig.nodeVerticalSpacing = minVerticalSpacing

  const hierarchyRoot = hierarchy<SyntaxNode>(
    result.root,
    (node) => node.children ?? []
  )

  const treeLayout = tree<SyntaxNode>().nodeSize([
    layoutConfig.nodeVerticalSpacing,
    layoutConfig.nodeHorizontalSpacing,
  ])

  const treeRoot = treeLayout(hierarchyRoot)

  const contentWidth =
    treeRoot.height * layoutConfig.nodeHorizontalSpacing +
    margin.left +
    margin.right

  const width = Math.max(
    MIN_VIEWBOX_WIDTH,
    contentWidth,
    typeof containerWidth === "number" ? containerWidth : 0
  )

  const rawNodes = treeRoot.descendants()
  const links = treeRoot.links()

  let verticalMin = Number.POSITIVE_INFINITY
  let verticalMax = Number.NEGATIVE_INFINITY

  const renderNodes: GrammarRenderNode[] = rawNodes.map((node) => {
    const lines = getDisplayLines(node.data, layoutConfig, useCompactLayout)
    const lineCount = lines.length || 1
    const boxHeight =
      lineCount * layoutConfig.lineHeight + layoutConfig.boxPaddingY

    const nodeTop = node.x - boxHeight / 2
    const nodeBottom = node.x + boxHeight / 2

    if (nodeTop < verticalMin) verticalMin = nodeTop
    if (nodeBottom > verticalMax) verticalMax = nodeBottom

    return {
      node,
      lines,
      boxHeight,
    }
  })

  if (!Number.isFinite(verticalMin) || !Number.isFinite(verticalMax)) {
    verticalMin = 0
    verticalMax = 0
  }

  const height = verticalMax - verticalMin + margin.top + margin.bottom
  const xOffset = margin.top - verticalMin

  return {
    nodes: renderNodes,
    links,
    width,
    height,
    xOffset,
    margin,
    config: layoutConfig,
    isCompact: useCompactLayout,
  }
}

type ContainerDimensions = {
  container: number
  viewport: number
}

export const PromptGrammarRenderer = ({
  result,
  className,
  style,
}: PromptGrammarRendererProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState<ContainerDimensions>({
    container: 0,
    viewport: 0,
  })

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const element = containerRef.current
    if (!element) {
      return
    }

    const updateWidth = () => {
      const elementWidth = element.getBoundingClientRect().width
      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : elementWidth
      const maxAllowedWidth =
        viewportWidth > 0 ? viewportWidth * 0.9 : undefined
      const appliedWidth =
        maxAllowedWidth !== undefined
          ? Math.min(elementWidth, maxAllowedWidth)
          : elementWidth

      setDimensions((prev) => {
        const next = {
          container: appliedWidth,
          viewport: viewportWidth,
        }

        const noChange =
          Math.abs(prev.container - next.container) < 1 &&
          Math.abs(prev.viewport - next.viewport) < 1

        return noChange ? prev : next
      })
    }

    updateWidth()

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateWidth()
      })
      observer.observe(element)
      return () => observer.disconnect()
    }

    window.addEventListener("resize", updateWidth)
    return () => {
      window.removeEventListener("resize", updateWidth)
    }
  }, [])

  const layout = useMemo(
    () => buildLayout(result, dimensions.container),
    [result, dimensions.container]
  )

  useLayoutEffect(() => {
    if (!layout) return

    const svgElement = containerRef.current?.querySelector("svg")
    if (!svgElement) return

    // Wait for text to fully render (including fonts)
    requestAnimationFrame(() => {
      const bbox = svgElement.getBBox()
      const padding = 48

      const newWidth = Math.ceil(bbox.width + padding * 2)
      const newHeight = Math.ceil(bbox.height + padding * 2)

      svgElement.setAttribute("viewBox", `0 0 ${newWidth} ${newHeight}`)
      svgElement.setAttribute("width", `${newWidth}`)
      svgElement.setAttribute("height", `${newHeight}`)
    })
  }, [layout])

  if (!layout) {
    return (
      <div
        ref={containerRef}
        className={clsx(
          "flex h-full w-full items-center justify-center rounded-xl bg-slate-50 p-6 text-sm text-slate-500",
          className
        )}
        style={style}
      >
        Grammar data is unavailable.
      </div>
    )
  }

  const { margin, config } = layout

  const maxWidthStyle =
    dimensions.viewport > 0
      ? `${Math.floor(dimensions.viewport * 0.9)}px`
      : undefined

  return (
    <div
      ref={containerRef}
      className={clsx(
        "w-full overflow-hidden rounded-xl bg-white p-4 shadow-sm",
        className
      )}
      style={{
        ...style,
        ...(maxWidthStyle ? { maxWidth: maxWidthStyle } : {}),
      }}
    >
      <svg
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="graphics-document"
        aria-label="Grammar analysis tree"
      >
        <g className="stroke-violet-200">
          {layout.links.map((link: GrammarHierarchyLink, index) => {
            const sourceX = link.source.x + layout.xOffset
            const sourceY = link.source.y + margin.left
            const targetX = link.target.x + layout.xOffset
            const targetY = link.target.y + margin.left
            const midY = (sourceY + targetY) / 2

            return (
              <path
                key={`link-${index}-${link.target.data.type}-${link.target.data.text}`}
                d={`M${sourceY},${sourceX} C${midY},${sourceX} ${midY},${targetX} ${targetY},${targetX}`}
                fill="none"
                strokeWidth={1.5}
              />
            )
          })}
        </g>

        <g>
          {layout.nodes.map(({ node, lines, boxHeight }, index) => {
            const lineCount = lines.length || 1
            const translateX = node.y + margin.left
            const translateY = node.x + layout.xOffset
            const firstLineOffset = -((lineCount - 1) / 2) * config.lineHeight

            return (
              <g
                key={`node-${index}-${node.data.type}-${node.data.text}`}
                transform={`translate(${translateX}, ${translateY})`}
              >
                <rect
                  x={-config.boxWidth / 2}
                  y={-boxHeight / 2}
                  width={config.boxWidth}
                  height={boxHeight}
                  rx={12}
                  className="fill-white stroke-violet-200"
                  strokeWidth={1.5}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-700"
                >
                  {lines.map((segment, lineIndex) => (
                    <tspan
                      key={`line-${lineIndex}-${segment.variant}`}
                      x={0}
                      dy={lineIndex === 0 ? firstLineOffset : config.lineHeight}
                      className={clsx(
                        segment.variant === "text" && "text-sm font-medium",
                        segment.variant === "note" && "text-xs fill-slate-500"
                      )}
                    >
                      {segment.value}
                    </tspan>
                  ))}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
