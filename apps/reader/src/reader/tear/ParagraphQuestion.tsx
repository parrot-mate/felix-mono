import { Chat } from "@mui/icons-material"
import { SwipeableDrawer } from "@mui/material"
import { ContextQAItem, PromptKeys, ReadingBook } from "@pmate/meta"
import { userSettingsAtom } from "@pmate/account-sdk"
import {
  addContextQuestionAtom,
  aiGenParagraphStr,
  contextQuestionAtom,
  runPrompt,
} from "@pmate/sdk"
import { Button, IconButton, InputField } from "@pmate/uikit"
import { useAtom, useAtomValue } from "jotai"
import { useState } from "react"

interface Params {
  book: ReadingBook
  paragraphIndex: number
}

export const ParagraphQuestion = ({ book, paragraphIndex }: Params) => {
  const userLang = useAtomValue(userSettingsAtom("uiLang"))
  const historyLoadable = useAtomValue(
    contextQuestionAtom({ book: book.id, paragraphIndex })
  )
  const [, addQA] = useAtom(
    addContextQuestionAtom({ book: book.id, paragraphIndex })
  )
  const [open, setOpen] = useState(false)
  const [questionInput, setQuestionInput] = useState("")
  const [loading, setLoading] = useState(false)
  const history = historyLoadable.unwrapOr([] as ContextQAItem[])

  const askQuestion = async () => {
    if (loading || !questionInput.trim()) return
    setLoading(true)
    const currentQuestion = questionInput
    setQuestionInput("")
    const promptKey =
      `reader/${book.lang}/${userLang}/context-question` as PromptKeys
    const paragraphContext = aiGenParagraphStr(book, paragraphIndex)
    const historyContext = history
      .map((h) => `${h.role === "user" ? "Q" : "A"}: ${h.text}`)
      .join("\n")
    const context = `${paragraphContext}\n${historyContext}`
    const result = await runPrompt(promptKey, {
      title: book.title,
      context,
      question: currentQuestion,
    })
    if (result) {
      await addQA({ role: "user", text: currentQuestion })
      const answer =
        typeof result === "object" && result !== null && "answer" in result
          ? (result as { answer?: string }).answer ?? ""
          : ""
      await addQA({
        role: "assistant",
        text: answer || String(result),
      })
    }
    setLoading(false)
  }

  return (
    <>
      <IconButton
        className="absolute bottom-[10px] left-[10px] z-[100] bg-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.7)]"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
      >
        <Chat fontSize="small" />
      </IconButton>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onOpen={() => {}}
        onClose={() => setOpen(false)}
      >
        <div className="p-2 relative max-h-[80vh]">
          {history.map((h, i) => (
            <div key={i} className="mb-1">
              <b>{h.role === "user" ? "You" : "AI"}:</b> {h.text}
            </div>
          ))}
          {loading && (
            <div className="flex items-center justify-center">...</div>
          )}
          <InputField
            multiline
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
          />

          <Button
            variant="secondary"
            className="mt-1"
            onClick={askQuestion}
            disabled={loading}
          >
            Ask
          </Button>
        </div>
      </SwipeableDrawer>
    </>
  )
}
