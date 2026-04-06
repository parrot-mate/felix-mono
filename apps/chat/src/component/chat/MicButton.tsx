import { useTypingTimeout } from "@/hook/chat/useTypingTimeout"
import { Logger } from "@pmate/utils"
import { IconCancel, IconMic, PulseRings } from "@pmate/uikit"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { useMicContext } from "@/hook/useMicContext"
import { useMicState } from "@/hook/useMicState"
import { CircleButton } from "./CircleButton"
import { MicEvents, MicState } from "./MicStateManage"

const logger = Logger.getDebugger("MicButton")

interface MicButtonProps {
  onStart: () => void
  onAbort: () => void
  onData?: (audioBlob: Blob) => void
  onEnd: (blob: Blob) => void
  disabled?: boolean
  timeout: number
}

export const MicButton = (props: MicButtonProps) => {
  const { manager: micSM } = useMicContext()
  const micState = useMicState()
  const buttonRef = useRef<HTMLDivElement>(null)
  const refCancel = useRef<HTMLDivElement>(null)
  const prevStateRef = useRef<MicState>(micState)
  const { onData, onEnd, onAbort, onStart } = props

  useEffect(() => {
    const unsubscribeData = micSM.on(MicEvents.DATA, (data: Blob) => {
      onData && onData(data)
    })
    const unsubscribeFinish = micSM.on(MicEvents.FINISHED, (data: Blob) => {
      onEnd && onEnd(data)
    })

    const unsubscribeAbort = micSM.on(MicEvents.ABORT, () => {
      onAbort && onAbort()
    })

    return () => {
      unsubscribeData()
      unsubscribeFinish()
      unsubscribeAbort()
    }
  }, [micSM, onAbort, onData, onEnd])

  const [inCancelArea, setInCancelArea] = useState(false)
  const {
    start: startTimeout,
    timeout,
    stop: stopTimeout,
  } = useTypingTimeout(props.timeout)

  const resetCancelState = () => {
    setInCancelArea(false)
  }

  useEffect(() => {
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!refCancel.current) {
      return
    }

    if (isPointInsideElement(refCancel.current, clientX, clientY)) {
      setInCancelArea(true)
      return
    }
    resetCancelState()
  }

  const handleTouchEnd = (clientX: number, clientY: number) => {
    if (!refCancel.current) {
      micSM.abort()
      return
    }

    if (
      refCancel.current &&
      isPointInsideElement(refCancel.current, clientX, clientY)
    ) {
      micSM.abort()
    } else {
      micSM.stop()
    }
    resetCancelState()
  }

  useEffect(() => {
    if (timeout === 0) {
      micSM.abort()
    }
  }, [timeout, micSM])

  useEffect(() => {
    const prevState = prevStateRef.current
    if (
      micState === MicState.Initializing &&
      prevState !== MicState.Initializing
    ) {
      onStart()
    }
    prevStateRef.current = micState
  }, [micState, onStart])

  const isRecording =
    micState === MicState.Initializing || micState === MicState.RECORDING

  useEffect(() => {
    if (isRecording) {
      startTimeout()
      setInCancelArea(false)
    } else {
      stopTimeout()
    }
  }, [isRecording, startTimeout, stopTimeout])

  return (
    <div className="relative w-full">
      {isRecording &&
        createPortal(
          <div aria-hidden className="fixed inset-0 bg-black/25 z-[1000]" />,
          document.body
        )}
      <div
        className={clsx(
          "relative inline-flex items-center justify-center shrink-0 leading-none",
          "h-20 w-20 z-[1001]"
        )}
        onTouchStart={() => {
          micSM.start()
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0]
          const clientX = touch.clientX
          const clientY = touch.clientY
          handleTouchMove(clientX, clientY)
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0]
          const clientX = touch.clientX
          const clientY = touch.clientY
          handleTouchEnd(clientX, clientY)
          logger.log("touch end")
        }}
        onTouchCancel={() => {
          micSM.abort()
        }}
        ref={buttonRef}
      >
        {isRecording && <PulseRings color="#9C6BFF" />}

        <IconMic className="w-full h-full relative z-10" />
      </div>

      {isRecording && (
        <CircleButton
          ref={refCancel}
          className={clsx(
            "absolute bottom-full mb-3 left-1/2 -translate-x-1/2",
            "z-[1002]",
            "w-10 h-10 flex items-center justify-center rounded-full",
            "transition-all duration-150 ease-out",
            !inCancelArea && "bg-gray-200 text-gray-700 shadow",
            inCancelArea &&
              "bg-red-500 text-white shadow-lg scale-110 ring-2 ring-red-300"
          )}
        >
          <IconCancel className="w-5 h-5" />
        </CircleButton>
      )}
    </div>
  )
}

const isPointInsideElement = (
  element: HTMLElement,
  clientX: number,
  clientY: number
) => {
  const rect = element.getBoundingClientRect()
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  )
}
