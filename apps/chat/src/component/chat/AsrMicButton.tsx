import { FC, useMemo, useRef, useState } from "react"

import { asrPipelineLoadingAtom } from "@/atom/chat/asrPipelineAtoms"
import { Logger } from "@pmate/utils"
import { learningLangAtom } from "@pmate/account-sdk"
import { AsyncStream, StreamEvent, pipelineWorkerAtom } from "@pmate/sdk"
import { useAtom, useAtomValue } from "jotai"
import { MicButton } from "./MicButton"

const logger = Logger.getDebugger("AsrMicButton")

interface AsrProps {
  disabled?: boolean
  onStart?: () => void
  onAsrResult: (result: { blob: Blob; text: string }) => void
  onProgress?: (text: string) => void
  onAbort?: () => void
  onRelease?: () => void
  onError?: (error: Error) => void
}
export const AsrMicButton: FC<AsrProps> = ({
  onStart,
  onAsrResult,
  disabled,
  onProgress,
  onAbort,
  onRelease,
  onError,
}) => {
  const learningLang = useAtomValue(learningLangAtom)
  const asrPipeline = useAtomValue(pipelineWorkerAtom)
  const promiseRef = useRef<Promise<string | null> | null>(null)
  const eventStreamRef = useRef<
    | (AsyncStream<StreamEvent<string, string>> & {
        finish: () => Promise<string | null>
      })
    | null
  >(null)
  const finalTextRef = useRef<string | null>(null)
  const errorRef = useRef<Error | null>(null)
  const [loading, setLoading] = useAtom(asrPipelineLoadingAtom)
  const [taskIndex, setTaskIndex] = useState(0)
  const stream = useMemo(() => {
    return new AsyncStream<Blob>()
  }, [taskIndex])

  const handleProgress = (text: string) => {
    logger.log("ASR progress:", text)
    if (onProgress) {
      onProgress(text)
    }
  }

  return (
    <MicButton
      timeout={30}
      disabled={loading || disabled}
      onData={(blob) => {
        stream.push(blob)
      }}
      onStart={() => {
        logger.log("start")
        onStart && onStart()
        errorRef.current = null
        finalTextRef.current = null
        const eventStream = asrPipeline.stream({
          to: "@asr#1",
          meta: { lang: learningLang },
          stream,
        })
        eventStreamRef.current = eventStream
        promiseRef.current = eventStream.finish()
        ;(async () => {
          try {
            for await (const event of eventStream) {
              if (event.type === "progress") {
                handleProgress(String(event.data ?? ""))
              } else if (event.type === "final") {
                finalTextRef.current =
                  typeof event.data === "string"
                    ? event.data
                    : String(event.data ?? "")
              }
            }
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            errorRef.current = err
            logger.error("ASR stream failed:", err)
            if (onError) {
              onError(err)
            }
          }
        })()
      }}
      onEnd={async (blob) => {
        onRelease && onRelease()
        if (promiseRef.current) {
          setLoading(true)
          try {
            stream.end()
            const result = await promiseRef.current
            const finalText =
              finalTextRef.current ??
              (typeof result === "string" ? result : String(result ?? ""))
            onProgress && onProgress(finalText)
            onAsrResult({
              blob,
              text: finalText,
            })
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            if (!errorRef.current) {
              errorRef.current = err
              logger.error("ASR processing failed:", err)
              if (onError) {
                onError(err)
              }
            }
          } finally {
            setLoading(false)
            setTaskIndex((i) => i + 1)
          }
        }
      }}
      onAbort={() => {
        promiseRef.current = null
        eventStreamRef.current = null
        finalTextRef.current = null
        errorRef.current = null
        stream.end()
        onAbort && onAbort()
        setLoading(false)
        setTaskIndex((i) => i + 1)
      }}
    />
  )
}
