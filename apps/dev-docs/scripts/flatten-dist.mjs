import fs from "node:fs/promises"
import path from "node:path"

const distDir = path.resolve("dist")
const clientDir = path.join(distDir, "client")

const exists = async (p) =>
  fs
    .stat(p)
    .then(() => true)
    .catch(() => false)

const moveEntry = async (entry) => {
  const from = path.join(clientDir, entry)
  const to = path.join(distDir, entry)
  await fs.rm(to, { recursive: true, force: true })
  await fs.rename(from, to)
}

const run = async () => {
  if (!(await exists(clientDir))) {
    console.log("[flatten-dist] skip: dist/client not found")
    return
  }

  const entries = await fs.readdir(clientDir)
  await Promise.all(entries.map(moveEntry))
  await fs.rm(clientDir, { recursive: true, force: true })
  console.log("[flatten-dist] moved dist/client/* -> dist/*")
}

run()
