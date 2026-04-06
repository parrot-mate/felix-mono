import { lru } from "@pmate/utils"
import fs from "fs"
import fetch from "node-fetch"
import os from "os"
import path from "path"
import { POSS } from "../util/alioss"
import { toWebp } from "../util/toWebp"

const HOME_DIR = os.homedir()

export const plusGenerateImage = lru(
  async (
    hash: string,
    prompt: string,
    portrait = false,
    steps = 40,
    guidance = 7
  ) => {
    console.log("plusGenerateImage", hash, prompt, portrait, steps, guidance)
    const url = "http://localhost:5001/generate_image"

    const dir = `${HOME_DIR}/generated_images`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, steps, guidance, portrait }),
    })
    const text = await res.text()

    const json = JSON.parse(text)
    const { filename } = json
    const file = path.resolve(dir, filename)

    const buffer = fs.readFileSync(file)
    const webp = await toWebp(buffer)

    await POSS.publicOSS.uploadFileToOSS(`plus-images/${hash}.webp`, webp)
  },
  {
    ttl: 60_000,
    key: (...args) => JSON.stringify(args),
  }
)
