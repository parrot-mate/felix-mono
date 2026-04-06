import { Langs } from "@pmate/meta"
import { PromiseQueue } from "@pmate/utils"
import fs from "fs"
import OpenAI from "openai"
import path from "path"
import "./env"

const SRC_DIR = path.join(__dirname, "../../../apps/ui/src")
const UIKIT_DIR = path.join(__dirname, "../../uikit/src")
const Component_DIR = path.join(__dirname, "../../components/src")
const I18N_DIR = path.join(__dirname, "../src/res")
const EN_PATH = path.join(I18N_DIR, "translation.json")
const ADD_PATH = path.join(I18N_DIR, "translation.additional.json")

const OTHER_LANGS = Langs.filter((l) => l.short !== "en").map((l) => ({
  ...l,
  path: path.join(I18N_DIR, `translation-${l.short}.json`),
}))

function scanDir(dir: string, keys: Set<string>) {
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      scanDir(full, keys)
    } else if (stat.isFile() && /\.(tsx?|jsx?)$/.test(item)) {
      const content = fs.readFileSync(full, "utf8")
      const regex = /(?<![\w$])t\(\s*["`]([^"`]+)["`]/g
      let m: RegExpExecArray | null
      while ((m = regex.exec(content))) {
        keys.add(m[1])
      }
    }
  }
}

const openai = new OpenAI({
  apiKey: process.env.BYTE_API_KEY,
  baseURL: process.env.BYTE_ENDPOINT,
})

async function translateBatch(map: Record<string, string>, lang: string) {
  const resp = await openai.chat.completions.create({
    model: "doubao-1-5-thinking-pro-250415",
    messages: [
      {
        role: "system",
        content:
          `Translate the following JSON object to ${lang}. ` +
          `Keep placeholders like {name} intact. ` +
          `Respond with JSON in the format {"key": "translation", ...} only.`,
      },
      { role: "user", content: JSON.stringify(map) },
    ],
    temperature: 0.2,
  })
  const txt = resp.choices[0].message.content?.trim() || "{}"
  try {
    return JSON.parse(txt) as Record<string, string>
  } catch {
    console.error("Failed to parse translation", txt)
    return {}
  }
}

async function update() {
  const keys = new Set<string>()
  scanDir(SRC_DIR, keys)
  scanDir(UIKIT_DIR, keys)
  scanDir(Component_DIR, keys)

  const en: Record<string, string> = JSON.parse(
    fs.readFileSync(EN_PATH, "utf8")
  )
  const additional: Record<string, string> = fs.existsSync(ADD_PATH)
    ? JSON.parse(fs.readFileSync(ADD_PATH, "utf8"))
    : {}
  const combinedKeys = { ...Object.fromEntries(keys.entries()), ...additional }

  const { record: updatedEn, changed: updated } = updateRecord(en, combinedKeys)
  if (updated) {
    fs.writeFileSync(EN_PATH, JSON.stringify(updatedEn, null, 2))
    console.log("Updated translation.json")
  }

  const queue = new PromiseQueue(5)
  for (const lang of OTHER_LANGS) {
    queue.enqueue(async () => {
      const dict: Record<string, string> = fs.existsSync(lang.path)
        ? JSON.parse(fs.readFileSync(lang.path, "utf8"))
        : {}
      const source = { ...dict }

      let changed = false
      const needTranslate: Record<string, string> = {}
      console.log("trans lang", lang)

      for (const [k, v] of Object.entries(updatedEn)) {
        if (!(k in dict)) {
          needTranslate[k] = v
          changed = true
        }
      }

      for (const k of Object.keys(dict)) {
        if (!(k in combinedKeys)) {
          delete dict[k]
          changed = true
        }
      }
      console.log("needTranslate", needTranslate)

      if (Object.keys(needTranslate).length > 0) {
        const translated = await translateBatch(needTranslate, lang.full)
        for (const [k, v] of Object.entries(translated)) {
          dict[k] = v
        }
      }

      if (changed || Object.keys(needTranslate).length > 0) {
        const { record: updated } = updateRecord(source, dict)
        fs.writeFileSync(lang.path, JSON.stringify(updated, null, 2))
        console.log(`Updated ${path.basename(lang.path)}`)
      }
    })
  }
  await queue.finish()
}

update()

function updateRecord(
  original: Record<string, string>,
  targetKeys: Record<string, string>
): { record: Record<string, string>; changed: boolean } {
  const origOrder = Object.keys(original)
  const desiredOrder = Object.keys(targetKeys)
  const copy: Record<string, string> = { ...original }
  let changed = false

  // 1. Add or update entries from targetKeys
  for (const k of desiredOrder) {
    if (!(k in copy)) {
      copy[k] = targetKeys[k]
      changed = true
    }
  }

  // 2. Remove any keys not in targetKeys
  for (const k of Object.keys(copy)) {
    if (!(k in targetKeys)) {
      delete copy[k]
      changed = true
    }
  }

  // 3. If nothing changed, return original
  if (!changed) {
    return { record: original, changed: false }
  }

  // 4. Build new key order:
  //    a) all original keys still in targetKeys, in original sequence
  //    b) then any new keys (from targetKeys) that weren’t in original
  const sortedKeys = [
    ...origOrder.filter((k) => k in targetKeys),
    ...desiredOrder.filter((k) => !origOrder.includes(k)),
  ]

  // 5. Reconstruct object in that order
  const sorted: Record<string, string> = {}
  for (const k of sortedKeys) {
    sorted[k] = copy[k]
  }

  return { record: sorted, changed: true }
}
