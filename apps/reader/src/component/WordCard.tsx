import { useWord } from "@/hook/useWord"
import { Logger } from "@pmate/utils"
import { getLangReadingSetting } from "@pmate/lang"
import {
  AIImgRequest,
  AIImgType,
  AIPhraseExplain,
  LangShort,
  ParagraphExplainParams,
} from "@pmate/meta"
import {
  audioPlayerAtom,
  AudioPlayers,
  paragraphExplainParamsToWordsPrompt,
  runPromptAtom,
  usePlayAudio,
  userFontSizeAtom,
} from "@pmate/sdk"
import { userSettingsAtom } from "@pmate/account-sdk"
import { IconButton, IconVolumeUp, Spinner } from "@pmate/uikit"
import { useAtomValue } from "jotai"
import React, { FC, forwardRef, Suspense } from "react"
import { AIImage } from "./AIImage"
import { VocabularyStar } from "./VocabularyStar"
import classes from "./WordCard.module.scss"

interface WordCardProps {
  wordStr: string
  sentence: string
  explainParams: ParagraphExplainParams[]
  paragraph: string
  isActive: boolean
  className?: string
  style?: React.CSSProperties
  pid?: number
  punchId?: number
}

const logger = Logger.getDebugger("WordCard")

function normalizeWord(wordStr: string) {
  return wordStr.replace(/^['"‘“]/, "").replace(/['"’”]$/, "")
}

export const WordCard = forwardRef<HTMLDivElement, WordCardProps>(
  (props: WordCardProps, ref) => {
    const wordStr = normalizeWord(props.wordStr)
    const { sentence, paragraph, pid } = props

    const bilingual = useAtomValue(userSettingsAtom("bilingual"))
    const fontSize = useAtomValue(userFontSizeAtom) * 0.9
    const wordPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.WordPlayer))
    const { play } = usePlayAudio(wordPlayer)

    const lang = (props.explainParams[0]?.lang || "en") as LangShort
    const supportWordDict = getLangReadingSetting(lang).isSupportWordDict

    // const bilingual = Boolean(context?.settings.bilingual)

    return (
      <div
        ref={ref}
        style={{
          ...props.style,
          fontSize: `${fontSize}px`,
        }}
        className={`${classes.WordCard} ${props.className || ""}`}
      >
        {supportWordDict && (
          <>
            <div
              className={classes.WordCardTitle}
              style={{
                alignItems: "center",
              }}
            >
              <strong
                style={{
                  wordBreak: "break-all",
                }}
              >
                {wordStr}
              </strong>
              {wordStr && (
                <IconButton
                  onClick={() => {
                    play({
                      text: wordStr,
                    })
                  }}
                >
                  <IconVolumeUp className="w-5 h-5" />
                </IconButton>
              )}
              <Suspense fallback={null}>
                <VocabularyStar
                  key={wordStr + "1"}
                  word={wordStr.toLowerCase()}
                />
              </Suspense>
            </div>
            <div className={classes.WordCardTitle}></div>
          </>
        )}

        <div className={classes.Content}>
          {sentence && paragraph && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-4">
                  <Spinner />
                </div>
              }
            >
              <RelatedExplain
                key={wordStr}
                explainParams={props.explainParams}
                wordStr={wordStr}
                sentence={sentence}
                paragraph={paragraph}
                bilingual={bilingual}
              />
            </Suspense>
          )}

          {supportWordDict && <WordDict key={wordStr} wordStr={wordStr} />}
        </div>
      </div>
    )
  }
)

const WordDict = ({ wordStr }: { wordStr: string }) => {
  return (
    <div className="flex flex-col">
      <div className="flex-1">
        <Suspense fallback={null}>
          <AIImage
            req={
              {
                type: AIImgType.WordExplain,
                params: {
                  word: wordStr.toLowerCase().trim(),
                },
              } as AIImgRequest<AIImgType.WordExplain>
            }
          />
        </Suspense>
        <Suspense fallback={null}>
          <WordMeaning wordStr={wordStr} />
        </Suspense>
      </div>
    </div>
  )
}

const WordMeaning = ({ wordStr }: { wordStr: string }) => {
  const word = useWord(wordStr, "en")
  if (!word) {
    return <div>暂无解释.</div>
  }
  const hasMeaning = word.l.length > 0
  if (!hasMeaning) {
    return null
  }

  return (
    <div
      className={`${classes.Meanings} flex-[2] pl-[10px] pr-[10px] pb-[10px]`}
    >
      <p
        style={{
          fontWeight: 700,
          color: "#999",
        }}
      >
        词典
      </p>
      {word.l.map((meaning, index) => {
        return (
          <p key={index}>
            <span
              style={{
                color: "#999",
              }}
            >
              {index + 1}.{" "}
            </span>
            <span
              style={{
                fontWeight: 700,
                color: "666",
                fontStyle: "italic",
                marginRight: "5px",
              }}
            >
              {meaning[0]}.
            </span>

            {meaning[1]}
          </p>
        )
      })}
    </div>
  )
}

interface RelatedExplainProps {
  wordStr: string
  sentence: string
  paragraph: string
  bilingual: boolean
  explainParams: ParagraphExplainParams[]
}
const RelatedExplain: FC<RelatedExplainProps> = ({
  sentence,
  wordStr,
  explainParams,
}) => {
  const param =
    explainParams.find(
      (x) => x.sentences[x.index]?.trim() === sentence.trim()
    ) ?? null

  if (!param) {
    throw new Error("RelatedExplain: param not found")
  }

  const uiLang = useAtomValue(userSettingsAtom("uiLang"))
  const targetUserLang = (param.userLang || uiLang) as LangShort | undefined
  const targetSentence = param.sentences[param.index] || sentence

  if (!targetSentence.trim() || !targetUserLang) {
    throw new Error("RelatedExplain: targetSentence or targetUserLang missing")
  }

  const wordsPrompt = paragraphExplainParamsToWordsPrompt(param, {
    sentenceOverride: targetSentence,
    userLang: targetUserLang,
  })

  const wordsLoadable = useAtomValue(
    runPromptAtom(
      wordsPrompt.promptKey,
      wordsPrompt.variables,
      {
        enabled: true,
      }
    )
  )
  const words = wordsLoadable.unwrapOr([] as AIPhraseExplain[])
  const fontSize = useAtomValue(userFontSizeAtom) * 0.9

  const relatedExplain = findRelatedExplain(
    words,
    wordStr,
    targetSentence,
    param.lang
  )

  if (!relatedExplain) {
    return null
  }
  return (
    <div className={classes.RelatedExplain}>
      <p>
        <strong
          style={{
            color: "#999",
            fontSize: `${fontSize}px`,
          }}
        >
          {relatedExplain.wordOrPhrase}
        </strong>
        {relatedExplain.explain}
      </p>
    </div>
  )
}

function findRelatedExplain(
  words: AIPhraseExplain[],
  wordStr: string,
  sentence: string,
  lang: LangShort
) {
  switch (lang) {
    case "zh-CN":
    case "zh-TW":
      return findRelatedExplainCN(words, wordStr, sentence)
    case "es-ES":
      return findRelatedExplainEN(words, wordStr, sentence)
    default:
      return findRelatedExplainEN(words, wordStr, sentence)
  }
}

function findRelatedExplainEN(
  words: AIPhraseExplain[],
  wordStr: string,
  sentence: string
): AIPhraseExplain | undefined {
  if (words.length === 0) {
    return
  }

  const lowerWordStr = wordStr.toLowerCase()
  const lowerSentence = sentence.toLowerCase()

  function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  const exactMatch = words.find(
    (x) => x.wordOrPhrase.toLowerCase() === lowerWordStr
  )
  if (exactMatch) {
    return exactMatch
  }

  const partialMatches = words.filter((x) => {
    const target = x.wordOrPhrase.toLowerCase()
    const regex = new RegExp(`\\b${escapeRegExp(lowerWordStr)}\\b`)
    return regex.test(target)
  })

  if (partialMatches.length === 0) {
    return undefined
  }

  function findAllMatches(
    pattern: RegExp,
    text: string
  ): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = []
    let match
    while ((match = pattern.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length })
      // Prevent infinite loops with zero-width matches
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++
      }
    }
    return matches
  }

  const wordRegex = new RegExp(`\\b${escapeRegExp(lowerWordStr)}\\b`, "g")
  const wordOccurrences = findAllMatches(wordRegex, lowerSentence)

  for (const match of partialMatches) {
    const phrase = match.wordOrPhrase.toLowerCase()
    const phraseRegex = new RegExp(escapeRegExp(phrase), "g")
    const phraseOccurrences = findAllMatches(phraseRegex, lowerSentence)
    for (const phraseOccurrence of phraseOccurrences) {
      for (const wordOccurrence of wordOccurrences) {
        if (
          wordOccurrence.start >= phraseOccurrence.start &&
          wordOccurrence.end <= phraseOccurrence.end
        ) {
          return match
        }
      }
    }
  }

  return undefined
}

function findRelatedExplainCN(
  words: AIPhraseExplain[],
  wordStr: string,
  sentence: string
): AIPhraseExplain | undefined {
  if (words.length === 0) {
    return
  }

  const exactMatch = words.find((x) => x.wordOrPhrase === wordStr)
  if (exactMatch) {
    return exactMatch
  }

  const partialMatches = words.filter((x) => x.wordOrPhrase.includes(wordStr))
  if (partialMatches.length === 0) {
    return undefined
  }

  for (const match of partialMatches) {
    if (sentence.includes(match.wordOrPhrase)) {
      return match
    }
  }

  return partialMatches[0]
}
