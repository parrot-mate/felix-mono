import { Logger } from "@pmate/utils"
import { useTranslation } from "@pmate/i18n"
import { Msg, MsgBodyMap, MsgOp, SYSTEM_NOTIFY_CODE } from "@pmate/meta"
import { useSnackbar } from "@pmate/uikit"
import { profileAtom } from "@pmate/account-sdk"
import { getIndexer, updateIndexerAtom } from "@sdk/atom/indexerAtom"
import { rtcAtom } from "@sdk/atom/rtcAtom"
import { rtcConnectedAtom } from "@sdk/atom/rtcConnectedAtom"
import { clientMessagesAtom } from "@sdk/atom/thread"
import { websocketStatusAtom } from "@sdk/atom/websocketStatusAtom"
import { Endpoints } from "@sdk/config"
import { UserMessageIndexer } from "@sdk/indexer"
import type { MultiPeerClient } from "@sdk/socket/MultiPeerClient"
import { PeerEvents } from "@sdk/socket/peer.def"
import { IndexerNames } from "@sdk/util/cindexer.def"
import { useAtomValue, useSetAtom } from "jotai"
import { createContext, Suspense, useEffect } from "react"

const RtcContext = createContext<MultiPeerClient | null>(null)
const logger = Logger.getDebugger("message")

export const RtcProvider = ({ children }: { children: React.ReactNode }) => {
  const profile = useAtomValue(profileAtom)
  const me = profile?.id ?? ""
  const rtc = useAtomValue(rtcAtom(me))

  const connected = useAtomValue(websocketStatusAtom(Endpoints.room))
  return (
    <RtcContext.Provider value={rtc}>
      <Suspense>
        <Sync me={me} />
      </Suspense>
      {connected && (
        <Suspense fallback={null}>{connected && children}</Suspense>
      )}
    </RtcContext.Provider>
  )
}

const Sync = ({ me }: { me: string }) => {
  const rtc = useAtomValue(rtcAtom(me))
  useSync(rtc, me)
  return null
}

const useSync = (rtc: MultiPeerClient | null, me: string) => {
  const updateUserLogsIndexer = useSetAtom(
    updateIndexerAtom(IndexerNames.UserLogs, me)
  )
  const setConn = useSetAtom(rtcConnectedAtom(me))
  const { enqueueSnackbar } = useSnackbar()
  const t = useTranslation()
  const appendClientMessage = useSetAtom(clientMessagesAtom(me))

  useEffect(() => {
    if (!rtc) {
      return
    }
    rtc.open()
    const handleChatMessage = (message: Msg<any>) => {
      localStorage.setItem("msg-last-receive-time", Date.now().toString())
      const userMsgIndexer = getIndexer(
        IndexerNames.UserMessages,
        me
      ) as UserMessageIndexer
      userMsgIndexer.aggregate(message)
      appendClientMessage({ type: "append", msg: message })
      logger.log("update store for send messages", message)
    }
    const unsub = rtc.onAll((msg) => {
      const { topic, body } = msg

      switch (topic) {
        case PeerEvents.ConnectionStateChanged: {
          const isConnected = body as boolean
          setConn(isConnected)

          break
        }
        case PeerEvents.Error: {
          const msg = body as Msg<any>
          const err = (msg.body as any)?.message || "Error"
          enqueueSnackbar(err, { variant: "error" })
          break
        }
        case PeerEvents.Receive: {
          const received = body as Msg<any>
          if (received.opcode === MsgOp.SYSTEM_NOTIFY) {
            const notifyBody = received.body as MsgBodyMap[MsgOp.SYSTEM_NOTIFY]
            const key = SYSTEM_NOTIFY_CODE[notifyBody.code]
            const text = t(key) || t("Unknown error")
            const notifyText = text
            enqueueSnackbar(t(notifyText), {
              variant: "warning",
            })
          }
          handleChatMessage(received)
          break
        }
        case PeerEvents.Sent: {
          handleChatMessage(body as Msg<any>)
          break
        }
      }
    })

    return () => {
      if (rtc) {
        logger.log("unsub")
        unsub()
        rtc.close()
        logger.log("close rtc")
      }
    }
  }, [rtc, appendClientMessage, updateUserLogsIndexer])
}
