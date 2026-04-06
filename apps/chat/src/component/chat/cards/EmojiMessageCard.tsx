import { Msg, MsgOp } from "@pmate/meta"
import { MessageCardDisplay } from "./MessageCardDisplay"

export const EmojiMessageCard = (props: { msg: Msg<MsgOp.EMOJI> }) => {
  return (
    <MessageCardDisplay msg={props.msg}>
      <div className="text-2xl">{props.msg.body.code}</div>
    </MessageCardDisplay>
  )
}
