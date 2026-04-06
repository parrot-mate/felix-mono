import { asrPipelineLoadingAtom } from "@/atom/chat/asrPipelineAtoms"
import { MicState } from "@/component/chat/MicStateManage"
import { useWaveform } from "@/hook/chat/useWaveform"
import { useMicAnalyzer } from "@/hook/useMicAnalyzer"
import { useMicState } from "@/hook/useMicState"
import { LangShort } from "@pmate/meta"
import {
  IconButton,
  IconCheck,
  IconClose,
  IconEditSquare,
  InputField,
  Modal,
  Spinner,
} from "@pmate/uikit"
import { useDebounce } from "@uidotdev/usehooks"
import { useAtomValue } from "jotai"
import { useRef, useState } from "react"
import { TranslationText } from "./TranslationText"

const LiveWaveform = ({ active }: { active: boolean }) => {
  const analyzerNode = useMicAnalyzer(active)
  const { canvasRef } = useWaveform(analyzerNode, { amplitudeBoost: 8 })

  return (
    <div className="w-full h-[72px] flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={320}
        height={72}
        className="w-full max-w-[320px] h-[72px]"
      />
    </div>
  )
}

interface TranscriptionCardProps {
  open: boolean
  text: string
  setText: (t: string) => void
  learningLang: LangShort
  motherLang: LangShort
  onCancel: () => void
  onConfirm: () => Promise<void>
}

const TranscriptionCardContent = ({
  open,
  text,
  setText,
  learningLang,
  motherLang,
  onCancel,
  onConfirm,
}: TranscriptionCardProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [editing, setEditing] = useState(false)
  const debounced = useDebounce(text, 1000)
  const isProcessing = useAtomValue(asrPipelineLoadingAtom)
  const micState = useMicState()

  const isInitializing = micState === MicState.Initializing
  const isRecording = micState === MicState.RECORDING
  const shouldBlockInteraction = isInitializing || isRecording

  const overlayBase = "items-end justify-start transition-colors"
  const overlayRecording = "bg-transparent pointer-events-none z-[1100]"
  const overlayFinished = "bg-black/25 pointer-events-auto z-[1100]"

  return (
    <Modal
      open={open}
      onClose={() => {
        setEditing(false)
        onCancel()
      }}
      className="w-full max-w-[480px] shadow-lg !p-0"
      overlayClassName={`${overlayBase} ${
        shouldBlockInteraction ? overlayRecording : overlayFinished
      }`}
    >
      <div
        className={`fixed left-1/2 top-1/2 w-4/5 h-1/4 center-translate bg-white p-5 flex flex-col rounded-xl 
          ${shouldBlockInteraction ? "shadow-2xl" : "shadow-md"} z-[1200]`}
      >
        {isInitializing ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-3">
            <Spinner size={32} color="#7c3aed" />
            <div className="text-sm text-gray-500">Preparing microphone…</div>
          </div>
        ) : isRecording ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-4">
            <LiveWaveform active={isRecording} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between p-5">
            {/* 顶部区域：文字 */}
            <div className="flex flex-col items-center">
              {editing ? (
                <>
                  <InputField
                    multiline
                    ref={inputRef}
                    className="w-full"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  {isProcessing && (
                    <div className="flex justify-center mt-2">
                      <Spinner size={18} color="#7c3aed" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 p-2 min-h-[25px] text-center">
                    {text}
                  </div>
                  {isProcessing ? (
                    <Spinner size={18} color="#7c3aed" />
                  ) : (
                    <IconButton
                      className="w-8 h-8 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setEditing(true)
                        setTimeout(() => inputRef.current?.focus(), 0)
                      }}
                    >
                      <IconEditSquare className="w-5 h-5" />
                    </IconButton>
                  )}
                </div>
              )}
              {text && (
                <div className="text-xs text-gray-500 mt-1 text-center">
                  <TranslationText
                    lang={learningLang}
                    targetLang={motherLang}
                    text={debounced}
                  />
                </div>
              )}
            </div>

            {/* 底部区域：按钮 */}
            <div className="flex justify-around mt-4">
              <IconButton
                className="w-10 h-10 rounded-full bg-gray-200"
                onClick={() => {
                  setEditing(false)
                  onCancel()
                }}
              >
                <IconClose className="w-5 h-5" />
              </IconButton>
              <IconButton
                className="w-10 h-10 rounded-full bg-violet-500 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isProcessing}
                onClick={async () => {
                  await onConfirm()
                  setEditing(false)
                }}
              >
                <IconCheck className="w-5 h-5" />
              </IconButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export const TranscriptionCard = (props: TranscriptionCardProps) => {
  return <TranscriptionCardContent {...props} />
}
