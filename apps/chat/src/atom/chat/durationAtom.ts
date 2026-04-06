import { translateAtom } from "@/atom/aigen/translateAtom"
import { atomWithRetry } from "@/atom/atomWithRetry"
import { learningLangAtom } from "@pmate/account-sdk"
import { audioDurationAtom } from "@pmate/sdk"
import { AudioTaskInit, LangShort, Msg, MsgOp } from "@pmate/meta"
import { Loadable, Logger } from "@pmate/utils"
import { atomFamily } from "jotai/utils"

interface TranslateParams {
  from: LangShort
  to: LangShort
  text: string
  instructions: string
  voice: string
}

const logger = Logger.getDebugger("AudioMessageDurationAtom")

export const durationAtom = atomFamily(
  (msg: Msg<MsgOp.TEXT>) => {
    return atomWithRetry(async (get) => {
      const learningLang = await get(learningLangAtom)
      const { body } = msg
      const { text, voice, lang, instructions } = body
      const needsTranslation = lang !== learningLang
      const translate = needsTranslation
        ? get(
            translateAtom({
              from: lang as LangShort,
              to: learningLang,
              text,
            })
          )
        : Loadable.Just(text)

      if (translate.isFail() || translate.isPending() || !translate.value) {
        throw new Error("translation fail")
      }

      const audioTask: AudioTaskInit = {
        text: translate.value || "",
        voice,
        lang: learningLang,
        instructions,
        timePoints: false,
      }

      const duration = await get(audioDurationAtom(audioTask))
      return [duration, translate.value] as [number, string]
    })
  },
  (a, b) => {
    return a.hash === b.hash
  }
)
