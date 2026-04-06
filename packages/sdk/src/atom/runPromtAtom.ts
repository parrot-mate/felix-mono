import { Loadable, Logger } from "@pmate/utils"
import type {
  PromptKeys,
  PromptReturnTypeMap,
  RunPromptParams,
} from "@pmate/meta"
import { atomWithRetry } from "@sdk/util/atomWithRetry"
import { WritableAtom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { runPrompt } from "@sdk/api"
const logger = Logger.getDebugger("runPromptAtom")

export type PromptRunStatus = "idle" | "loading" | "success" | "error"

export interface PromptRunState {
  status: PromptRunStatus
  data: unknown
  error: unknown
}

export type PromptRunParamsWithEnabled = RunPromptParams & {
  enabled: boolean
}
const _runPromptAtom = atomFamily((params: PromptRunParamsWithEnabled) => {
  const { type, variables, enabled } = params
  return atomWithRetry(async () => {
    if (!enabled) {
      return Loadable.Nothing()
    }
    logger.log("run", { type, variables, enabled })
    const r = await runPrompt(type, variables)
    logger.log("result", r)
    return r
  })
}, isEqual)

export const runPromptAtom = <T extends PromptKeys>(
  promptKey: T,
  variables: Record<string, any>,
  options: { enabled: boolean } = { enabled: true }
) =>
  _runPromptAtom({
    type: promptKey,
    variables,
    enabled: options.enabled,
  }) as WritableAtom<Loadable<PromptReturnTypeMap[T]>, [], void>