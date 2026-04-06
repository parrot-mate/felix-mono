import type { LangShort, ResourceTypes } from "@pmate/meta"
import { keccak256 } from "js-sha3"

interface HashFunction {
  salt: string
  folder: string
}

const hashFunctions: { [keyof in ResourceTypes]: HashFunction } = {
  "book-analyze": {
    salt: "RhEWOGkUuh",
    folder: "analyze-v4.10",
  },
  image: {
    salt: "jqQVsJn6LW",
    folder: "images-v2.1",
  },
  cover: {
    salt: "b74UwyZtXu",
    folder: "covers-v2",
  },
  "word-simple": {
    salt: "43hHAhBKOL",
    folder: "word-simple-v1.1",
  },
  tts: {
    salt: "KLvef#fsopO",
    folder: "tts-v0.11",
  },
}

function normalizeWord(word: string) {
  return word
    .replace(/\s{2,}/g, " ")
    .toLowerCase()
    .trim()
}

export const resourceKey = (type: ResourceTypes, ...args: string[]) => {
  const { salt, folder } = hashFunctions[type]

  args = args.map((x) => normalizeWord(x)).filter((x) => x)
  if (args.length === 0) throw new Error("No arguments provided")

  const hash = keccak256(`${folder}|${salt}|${args.join("|")}`)

  switch (type) {
    case "word-simple":
      return `${folder}/${args[0]}/${hash}.json`
    case "book-analyze":
      return `${folder}/${hash}.json`
    case "image":
      // case "imageplus":
      return `${folder}/${hash}.webp`
    case "cover":
      return `${folder}/${hash}.webp`
    case "tts":
      return `${folder}/${hash}.mp3`
  }
}

export const resourceKeyTTS = (
  provider: string,
  voice: string,
  text: string,
  instructions: string,
  lang: LangShort,
  timePoints?: boolean
) => {
  return resourceKey(
    "tts",
    provider,
    voice,
    text,
    instructions,
    lang,
    timePoints ? "true" : "false"
  )
}
