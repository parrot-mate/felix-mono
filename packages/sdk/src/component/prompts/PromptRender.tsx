import { Logger } from "@pmate/utils"
import type { GrammarTree, PromptContextExplain, PromptKeys } from "@pmate/meta"
import { Button, Spinner } from "@pmate/uikit"
import clsx from "clsx"
import { useAtom } from "jotai"
import { type ReactNode } from "react"
import { runPromptAtom } from "@sdk/atom/runPromtAtom"
import { LegacyPromptContextExplainRenderer } from "./LegacyPromptContextExplainRenderer"
import { PromptContextExplainRenderer } from "./PromptContextExplainRenderer"
import { PromptGrammarRenderer } from "./PromptGrammarRenderer"
import type { PromptRendererSharedProps } from "./types"

export interface PromptRenderProps extends PromptRendererSharedProps {
  promptKey: PromptKeys
  variables: Record<string, any>
  auto?: boolean
}
const logger = Logger.getDebugger("PromptRender")

const renderPromptContent = (
  promptKey: PromptKeys,
  result: unknown,
  sharedProps: PromptRendererSharedProps
): ReactNode => {
  const promptKeyString = String(promptKey)

  if (/^reader\/.*\/context-explain-v2$/.test(promptKeyString)) {
    return (
      <PromptContextExplainRenderer
        result={result as PromptContextExplain}
        {...sharedProps}
      />
    )
  }

  if (/^reader\/.*\/context-explain$/.test(promptKeyString)) {
    return (
      <LegacyPromptContextExplainRenderer
        result={result as string}
        {...sharedProps}
      />
    )
  }

  if (/^reader\/.*\/grammar$/.test(promptKeyString)) {
    return (
      <PromptGrammarRenderer
        result={result as GrammarTree}
        {...sharedProps}
      />
    )
  }

  throw new Error(
    `PromptRender is not implemented for promptKey: ${promptKey as string}`
  )
}

export const PromptRender = ({
  promptKey,
  variables,
  auto = true,
  className,
  onEvent,
  style,
}: PromptRenderProps) => {
  const [result, retry] = useAtom(
    runPromptAtom(promptKey, variables, {
      enabled: auto,
    })
  )

  if (result.isPending()) {
    return (
      <div
        className={clsx(
          "flex h-full w-full items-center justify-center",
          className
        )}
        style={style}
      >
        <Spinner />
      </div>
    )
  }

  if (result.isNothing() || result.isFail()) {
    return (
      <div
        className={clsx(
          "flex h-full w-full flex-col items-center justify-center gap-3 text-center",
          className
        )}
        style={style}
      >
        <p
          className={clsx(
            "text-sm",
            result.isFail() ? "text-red-500" : "text-gray-500"
          )}
        >
          {result.isFail() ? "Failed to load prompt result." : "No result yet."}
        </p>
        <Button type="button" variant="secondary" onClick={() => retry()}>
          Retry
        </Button>
      </div>
    )
  }

  const resultData = result.unwrap()

  const content = renderPromptContent(promptKey, resultData, {
    className,
    onEvent,
    style,
  })

  return <>{content}</>
}