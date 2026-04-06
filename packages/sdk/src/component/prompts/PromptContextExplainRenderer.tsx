import { useTranslation } from "@pmate/i18n"
import type { PromptContextExplain } from "@pmate/meta"
import { IconButton, IconVolumeUp } from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { type ReactNode } from "react"
import { audioPlayerAtom } from "@sdk/atom"
import { usePlayAudio } from "@sdk/hooks"
import { AudioPlayers } from "@sdk/util/audio"
import { VocabularyStar } from "@sdk/component/VocabularyStar"
import { PromptGrammarRenderer } from "./PromptGrammarRenderer"
import type { PromptRendererSharedProps } from "./types"

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className="flex flex-col mb-3">
    <h3 className="text-base font-semibold uppercase tracking-wide font-bold text-violet-500 font-size-[20px]">
      {title}
    </h3>
    {children}
  </div>
)

const TextBlock = ({ children }: { children: string }) => (
  <div className="rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
    {children}
  </div>
)

const hasContent = (value: string) => value.trim().length > 0

export interface PromptContextExplainRendererProps
  extends PromptRendererSharedProps {
  result: PromptContextExplain
}

export const PromptContextExplainRenderer = ({
  result,
  className,
}: PromptContextExplainRendererProps) => {
  const { bilingualPairs, interpretation, keyAndDifficultTerms, grammar } =
    result
  const t = useTranslation()

  const containerClassName = ["flex flex-col gap-6", className]
    .filter(Boolean)
    .join(" ")

  const wordPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.WordPlayer))
  const { play } = usePlayAudio(wordPlayer)
  return (
    <div className={containerClassName}>
      {Array.isArray(bilingualPairs) && bilingualPairs.length > 0 && (
        <Section title={t("Translation")}>
          <div className="flex flex-row flex-wrap">
            {bilingualPairs.map((pair) => (
              <div
                key={`${pair.from}-${pair.to}`}
                className="flex justify-between flex-col"
              >
                <span className="font-bold text-violet-300">{pair.from}</span>
                <span>{pair.to}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {hasContent(interpretation) && (
        <Section title={t("Interpretation")}>
          <TextBlock>{interpretation}</TextBlock>
        </Section>
      )}

      {Array.isArray(keyAndDifficultTerms) &&
        keyAndDifficultTerms.length > 0 && (
          <Section title={t("Key Vocabulary & Terms")}>
            <div className="flex flex-col">
              {keyAndDifficultTerms.map((term, index) => (
                <div key={`${term.term}-${index}`}>
                  <div className="flex flex-row">
                    <strong
                      className="text-violet-300"
                      style={{
                        wordBreak: "break-all",
                      }}
                    >
                      {term.term}
                    </strong>
                    <IconButton
                      onClick={() => {
                        play({
                          text: term.term,
                        })
                      }}
                    >
                      <IconVolumeUp className="w-5 h-5 fill-violet-400" />
                    </IconButton>
                    <VocabularyStar word={term.term} />
                  </div>
                  <div className="mt-1">{term.explain}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

      {grammar?.root && (
        <Section title={t("Grammar")}>
          <PromptGrammarRenderer result={grammar} />
        </Section>
      )}
    </div>
  )
}