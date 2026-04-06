import path from "path"
import "./env"
import { uploadDirectory } from "./util"

async function run() {
  await uploadDirectory(path.join(__dirname, "../dist"), "/")
}

run()
