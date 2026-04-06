import { Msg, MsgOp } from "@pmate/meta"
import { useTranslation } from "@pmate/i18n"

export const GroupPeersMessageCard = (
  props: { msg: Msg<MsgOp.GROUP_NEW_PEERS | MsgOp.GROUP_REMOVE_PEERS> }
) => {
  const t = useTranslation()
  const peers = props.msg.body.peers.join(", ")
  const text =
    props.msg.opcode === MsgOp.GROUP_NEW_PEERS
      ? t("joined the room")
      : t("left the room")
  return (
    <div className="text-center text-xs text-gray-500">{peers} {text}</div>
  )
}
