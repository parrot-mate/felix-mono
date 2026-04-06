import { PromiseQueue } from "@pmate/utils"
import { Box, Button, Drawer, LinearProgress } from "@mui/material"
import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import {
  downloadTasksAtom,
  showDownloadTaskModal,
} from "./atoms/downloadTasksAtom"
import { downloadTask } from "./resource/downloader"

export const DownloadOffline = ({
  bookId,
  pid,
}: {
  bookId: string
  pid: number
}) => {
  const tasks = useAtomValue(
    downloadTasksAtom({
      bookId,
      pid,
    })
  )
  const [progress, setProgress] = useState(0)
  const setModal = useSetAtom(showDownloadTaskModal)

  const download = async () => {
    const promiseQueue = new PromiseQueue(10)
    for (let i = 0; i < tasks.length; i++) {
      promiseQueue.enqueue(async () => {
        await downloadTask(tasks[i])
        setProgress((prev) => prev + 1)
      })
    }
    await promiseQueue.finish()
  }
  return (
    <Drawer
      anchor="bottom"
      open={true}
      PaperProps={{
        sx: {
          borderRadius: 0,
        },
      }}
    >
      <Box>
        <h2>离线下载下面的100页</h2>
        <p>总下载任务:{tasks.length}</p>
        <LinearProgress
          variant="determinate"
          value={Math.floor((progress * 100) / tasks.length)}
        />
        <Button
          onClick={() => {
            if (progress === tasks.length) {
              setModal(false)
            } else {
              download()
            }
          }}
        >
          {progress === tasks.length ? "完成" : "开始"}
        </Button>
      </Box>
    </Drawer>
  )
}
