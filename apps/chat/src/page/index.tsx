import { ThreadList } from "@/component/chat/ThreadList"
import { ChatHomeTitleBar } from "@/component/chat/ChatHomeTitleBar"

export const ThreadListPage = () => {
  return (
    <div className="w-full h-full flex flex-col bg-gradient-parrot">
      <ChatHomeTitleBar />
      <ThreadList />
    </div>
  )
}

export default ThreadListPage
