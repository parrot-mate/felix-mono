import { ContextExplainMarkdown } from "./ContextExplainMarkdown"
import type { PromptRendererSharedProps } from "./types"

export interface LegacyPromptContextExplainRendererProps
  extends PromptRendererSharedProps {
  result: string
}

export const LegacyPromptContextExplainRenderer = ({
  result,
  className,
  onEvent,
  style,
}: LegacyPromptContextExplainRendererProps) => {
  const containerClassName = [
    "rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm leading-relaxed text-slate-200",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={containerClassName} style={style}>
      <ContextExplainMarkdown content={result} onEvent={onEvent} />
    </div>
  )
}
