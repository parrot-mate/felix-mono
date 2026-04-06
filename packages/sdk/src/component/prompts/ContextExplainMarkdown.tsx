import { IconButton, IconSound } from "@pmate/uikit"
import ReactMarkdown from "react-markdown"
import { VocabularyStar } from "@sdk/component/VocabularyStar"
import type { PromptRendererSharedProps } from "./types"

export interface ContextExplainMarkdownProps extends PromptRendererSharedProps {
  content: string
  baseFontSize?: number
}

const isPlainWord = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z ]+$/.test(value)

export const ContextExplainMarkdown = ({
  content,
  baseFontSize,
  className,
  onEvent,
}: ContextExplainMarkdownProps) => {
  const headingStyle =
    typeof baseFontSize === "number"
      ? { fontSize: baseFontSize * 0.9 }
      : undefined

  return (
    <ReactMarkdown
      className={className}
      components={{
        h3(props) {
          const { children, ...rest } = props
          return (
            <h3
              {...rest}
              style={{ color: "#1d7465", ...headingStyle }}
              className="font-semibold"
            >
              {children}
            </h3>
          )
        },
        strong(props) {
          const { children } = props
          const [firstChild] = children

          if (isPlainWord(firstChild)) {
            const word = firstChild.trim()
            const normalizedWord = word.toLowerCase()
            return (
              <span>
                <strong className="text-primary-500">{word}</strong>
                {onEvent ? (
                  <IconButton
                    className="ml-0.5 inline-block align-middle"
                    onClick={() => {
                      onEvent?.("word:play", { word })
                    }}
                  >
                    <IconSound className="h-5 w-5 fill-primary-400" />
                  </IconButton>
                ) : null}
                <VocabularyStar
                  word={normalizedWord}
                  sentence=""
                  className="ml-0.5 inline-block align-middle"
                />
              </span>
            )
          }

          return <strong className="text-green-600">{props.children}</strong>
        },
        ol(props) {
          return <ol className="pl-4" {...props} />
        },
        ul(props) {
          return <ul className="pl-4" {...props} />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
