import type { CSSProperties } from "react"

export interface PromptRendererSharedProps {
  className?: string
  onEvent?: (name: string, payload: unknown) => void
  style?: CSSProperties
}
