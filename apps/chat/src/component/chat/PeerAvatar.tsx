import { peerAtom } from "@pmate/sdk"
import { useAtomValue } from "jotai"

export const PeerAvatar = (props: { id: string; className?: string }) => {
  const { id, className } = props

  const peer = useAtomValue(
    peerAtom({
      id,
    })
  )

  if (!peer) {
    return null
  }

  const baseCls = className ? `${className} ` : ""
  const containerCls = `${baseCls}rounded-full overflow-hidden flex items-center justify-center`
  const letter = (peer.nickName || peer.id)[0]?.toUpperCase() || "?"

  if (peer.avatar) {
    return (
      <div className={containerCls}>
        <img
          className="w-full h-full object-cover"
          src={peer.avatar}
          alt={peer.nickName || peer.id}
        />
      </div>
    )
  }

  return (
    <div className={`${containerCls} bg-gray-300 text-white font-bold`}>{letter}</div>
  )
}
