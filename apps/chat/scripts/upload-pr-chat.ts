import path from "path"
import "./env"
import { uploadDirectory } from "./util"

const branch = (process as NodeJS.Process).argv[2]
if (!branch) {
  console.error("Branch name required")
  ;(process as NodeJS.Process).exit(1)
}

async function run() {
  await uploadDirectory(
    path.join(__dirname, "../dist/chat"),
    `/chat-pr-${branch}`
  )
}

run()
