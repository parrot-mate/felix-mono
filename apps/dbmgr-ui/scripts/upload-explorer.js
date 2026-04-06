import path from "path"
import { fileURLToPath } from "url"
import "./env.js"
import { uploadDirectory } from "./util.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  await uploadDirectory(path.join(__dirname, "../dist"), "/")
}

run().catch((error) => {
  console.error("Upload failed:", error)
  process.exitCode = 1
})
