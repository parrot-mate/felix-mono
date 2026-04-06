import { ChatTitleBar } from "@/component/chat/ChatTitleBar"
import { useRoomContext } from "@pmate/sdk"
import { IconButton, IconMoreHorizontal } from "@pmate/uikit"
import { useState } from "react"
import { ChatSettingsPanel } from "./ChatSettingsPanel"

export const DirectChatTitleBar = () => {
  const { other, threadHash } = useRoomContext()
  const [open, setOpen] = useState(false)
  return (
    <>
      <ChatTitleBar
        className="shadow-sm"
        title={other?.nickName || ""}
        variant="gradient"
        right={
          <IconButton onClick={() => setOpen(true)} className="text-white">
            <IconMoreHorizontal className="w-6 h-6" />
          </IconButton>
        }
      />
      <ChatSettingsPanel
        open={open}
        onClose={() => setOpen(false)}
        type="dm"
        threadHash={threadHash}
        otherId={other?.id}
      />
    </>
  )
}
