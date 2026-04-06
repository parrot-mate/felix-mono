import path from "path"
import "./env"
import { uploadDirectory } from "./util"

async function run() {
  uploadDirectory(path.join(__dirname, "../dist/chat"), "/chat")
}

run()
