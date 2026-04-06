import { useSentenceExplainSetup } from "@/hook/useSentenceExplainSetup"
import { explainTabsAtom } from "@/reader/atom/explainTabsAtom"
import {
  AudioPlayers,
  PromptRender,
  audioPlayerAtom,
  usePlayAudio,
  userFontSizeAtom,
} from "@pmate/sdk"
import { DrawerProps, Drawer as UIDrawer } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { memo, useCallback } from "react"

export const SentenceExplainDrawer = memo(
  ({ mode }: { mode: "float" | "fixed" }) => {
    const explainData = useAtomValue(explainTabsAtom)
    const open = Boolean(explainData)
    const setExplainData = useSetAtom(explainTabsAtom)
    const close = useCallback(() => {
      setExplainData(null)
    }, [setExplainData])

    const fontSize = useAtomValue(userFontSizeAtom) * 0.8

    const wordPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.WordPlayer))
    const { play } = usePlayAudio(wordPlayer)
    const handleEvent = useCallback(
      (eventName: string, payload: unknown) => {
        if (
          eventName === "word:play" &&
          payload &&
          typeof payload === "object" &&
          "word" in payload
        ) {
          play({
            text: String((payload as { word: string }).word ?? ""),
          })
        }
      },
      [play]
    )

    const { promptKey, sentence, variables } = useSentenceExplainSetup()

    if (!open || !promptKey || !variables) {
      return null
    }

    return (
      <Drawer
        id="sa-drawer"
        mode={mode}
        anchor="bottom"
        open={open}
        onClose={() => {
          close()
        }}
      >
        <div className="h-[80vh]">
          <div className="overflow-y-scroll flex-1">
            <div className="p-2">
              <div key={sentence}>
                <PromptRender
                  promptKey={promptKey}
                  variables={variables}
                  onEvent={handleEvent}
                />
                <PromptRender
                  promptKey={"reader/en/zh-CN/grammar"}
                  variables={{
                    sentence,
                  }}
                  onEvent={handleEvent}
                />
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    )
  }
)

const Drawer = (
  props: DrawerProps & {
    mode: "float" | "fixed"
  }
) => {
  const { mode, ...rest } = props
  if (mode === "fixed") {
    if (rest.open) {
      return <div>{rest.children}</div>
    }
    return null
  }
  return <UIDrawer {...rest} />
}
