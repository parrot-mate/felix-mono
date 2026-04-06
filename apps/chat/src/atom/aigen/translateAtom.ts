import { TranslationService } from "@pmate/sdk"
import { LangShort } from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"
import { atomWithRetry } from "../atomWithRetry"

interface TranslationParams {
  from: LangShort
  to: LangShort
  text: string
  via?: "rough" | "accurate"
  context?: string
}
const logger = Logger.getDebugger("translateAtom")
export const translateAtom = atomFamily((params: TranslationParams) => {
  return atomWithRetry(async (_get) => {
    const { from, to, text, via = "rough", context } = params
    if (!text) {
      return ""
    }

    if (from === to) {
      return text
    }

    const result =
      via === "accurate"
        ? await TranslationService.aiTranslate(from, to, text, context || "")
        : await TranslationService.apiTranslation(from, to, text)
    logger.log(`translate`, from, to, text, via, result)

    return result ?? ""
  })
}, isEqual)
