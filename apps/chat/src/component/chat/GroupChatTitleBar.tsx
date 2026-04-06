import { ChatTitleBar } from "@/component/chat/ChatTitleBar"
import { useRoomContext } from "@pmate/sdk"
import { Logger } from "@pmate/utils"
import { IconButton, IconMoreHorizontal } from "@pmate/uikit"
import { useState } from "react"
import { ChatSettingsPanel } from "./ChatSettingsPanel"
import { PeerAvatar } from "./PeerAvatar"

const logger = Logger.getDebugger("GroupChatTitleBar")
export const GroupChatTitleBar = () => {
  const { threadHash, roomInfo } = useRoomContext()
  const [open, setOpen] = useState(false)
  return (
    <>
      <ChatTitleBar
        className="shadow-sm"
        variant="solid"
        title={
          <div className="flex flex-row items-center gap-1 flex-1 overflow-x-auto px-2 text-white text-[1.25rem]">
            {roomInfo.title}
          </div>
        }
        right={
          <IconButton onClick={() => setOpen(true)} className="text-white">
            <IconMoreHorizontal className="w-6 h-6" />
          </IconButton>
        }
      />
      <ChatSettingsPanel
        open={open}
        onClose={() => setOpen(false)}
        type="group"
        threadHash={threadHash}
      />
    </>
  )
}
