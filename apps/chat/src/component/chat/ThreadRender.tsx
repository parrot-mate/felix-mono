import { threadAudioEntriesAtom } from "@/atom/aigen/threadAudioEntriesAtom"
import { useThreadMessages } from "@/hook/useThreadMessages"
import {
  CombinedResourceProvider,
  enterThreadAtom,
  useRoomContext,
} from "@pmate/sdk"
import { Spinner } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import type { UIEvent } from "react"
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { MessageCard } from "./cards/MessageCard"
import { DirectChatTitleBar } from "./DirectChatTitleBar"
import { GroupChatTitleBar } from "./GroupChatTitleBar"
import { MessageInput } from "./MessageInput"

function getQueryMessageId() {
  const urlParams = new URLSearchParams(window.location.href.split("?")[1])
  const hash = urlParams.get("hash")
  return hash
}

export const ThreadRender = () => {
  const { threadHash, relationship, me } = useRoomContext()
  const userId = me?.id ?? ""

  const setEnterThread = useSetAtom(enterThreadAtom(threadHash))
  useEffect(() => {
    setEnterThread()
  }, [setEnterThread])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const hasInitialScroll = useRef(false)
  const [initialScrollFinished, setInitialScrollFinished] = useState(false)
  const queryMessageId = getQueryMessageId()
  const {
    messages: fetchedMessages,
    hasPrevious,
    loadOlder,
  } = useThreadMessages()
  const messages = queryMessageId
    ? fetchedMessages.filter((msg) => msg.hash === queryMessageId)
    : fetchedMessages

  useEffect(() => {
    if (messages.length === 0 || hasInitialScroll.current) {
      return
    }
    const timer = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "instant",
        block: "end",
      })
      hasInitialScroll.current = true
      setInitialScrollFinished(true)
    }, 50)
    return () => window.clearTimeout(timer)
  }, [messages.length])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  const isDirect = threadHash.startsWith("dm@")

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!hasPrevious || !initialScrollFinished) {
        return
      }
      const element = event.currentTarget
      if (element.scrollTop <= 100) {
        loadOlder()
      }
    },
    [hasPrevious, loadOlder, initialScrollFinished]
  )

  const audioEntriesAtom = useMemo(
    () => threadAudioEntriesAtom({ threadHash, userId }),
    [threadHash, userId]
  )
  const audioEntries = useAtomValue(audioEntriesAtom)

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        visibility: initialScrollFinished ? "visible" : "hidden",
      }}
    >
      {isDirect ? <DirectChatTitleBar /> : <GroupChatTitleBar />}
      <CombinedResourceProvider value={audioEntries}>
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-gray-50 pb-[80px]"
        >
          {hasPrevious && initialScrollFinished ? (
            <div className="flex justify-center py-2">
              <Spinner size={20} color="#6b7280" />
            </div>
          ) : null}
          {messages.map((msg) => {
            return (
              <MessageCard
                visible={initialScrollFinished}
                key={msg.hash}
                msg={msg}
              />
            )
          })}
          <div className="h-[60px]" ref={messagesEndRef} />
        </div>
        {/* <VirtualizedList
          className="flex-1 overflow-y-auto bg-gray-50 pb-[80px]"
          data={messages}
          resolveKey={(msg) => msg.hash}
          renderItem={(msg, { state }) => (
            <Suspense>
              <MessageCard msg={msg} virtualState={state} />
            </Suspense>
          )}
          topContent={
            hasPrevious ? (
              <div className="flex justify-center py-2">
                <Spinner size={20} color="#6b7280" />
              </div>
            ) : null
          }
          bottomContent={<div className="h-[200px]" ref={messagesEndRef} />}
          onScroll={handleScroll}
        /> */}
      </CombinedResourceProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        }
      >
        <MessageInput />
      </Suspense>
    </div>
  )
}
