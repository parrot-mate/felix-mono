import { Logger, WebsocketEvents } from "@pmate/utils"
import { Modal, Spinner } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { useEffect } from "react"
import { type Endpoint, realtimeClientAtom } from "@sdk/atom/realtimeClientAtom"
import { networkUnstableAtom } from "@sdk/atom/networkUnstableAtom"
import { websocketStatusAtom } from "@sdk/atom/websocketStatusAtom"

type Props = {
  endpoints: Endpoint[]
  children: React.ReactNode
}
const logger = Logger.getDebugger("HybridProvider")

const Syncer = ({ endpoint }: { endpoint: Endpoint }) => {
  const client = useAtomValue(realtimeClientAtom(endpoint))
  const setStatus = useSetAtom(websocketStatusAtom(endpoint))

  useEffect(() => {
    setStatus("connecting")
  }, [endpoint, setStatus])

  useEffect(() => {
    if (!client) {
      return
    }
    let hasConnected = client.isConnected()
    setStatus(hasConnected ? "connected" : "connecting")
    const disconnect = client.on(
      WebsocketEvents.Connected,
      (connected: boolean) => {
        hasConnected = connected || hasConnected
        setStatus(connected ? "connected" : "error")
      }
    )
    const reconnecting = client.on(WebsocketEvents.Connecting, () => {
      setStatus("connecting")
    })
    const onError = client.on(WebsocketEvents.Error, () => {
      if (!hasConnected && client.getConnectionType() === "h3") {
        logger.log("Falling back to websocket transport", { endpoint })
        client.close()
        setStatus("connecting")
        return
      }
      setStatus("error")
    })
    return () => {
      disconnect()
      reconnecting()
      onError()
    }
  }, [client, endpoint, setStatus])

  return null
}

export const HybridProvider = ({ endpoints, children }: Props) => {
  const unstable = useAtomValue(networkUnstableAtom(endpoints))
  return (
    <>
      {endpoints.map((e) => (
        <Syncer key={e.ws} endpoint={e} />
      ))}
      {children}
      {unstable && (
        <Modal open onClose={() => {}}>
          <div className="flex flex-col items-center justify-center p-4">
            <Spinner />
          </div>
        </Modal>
      )}
    </>
  )
}

export { Syncer }