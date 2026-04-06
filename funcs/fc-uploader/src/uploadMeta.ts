import { UploadType } from "./upload.configs"

const extensionToMime: Record<string, string> = {
  json: "application/json",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  wav: "audio/wav",
  mp3: "audio/mpeg",
  webp: "image/webp",
  webm: "video/webm",
  png: "image/png",
  pdf: "application/pdf",
  mobi: "application/x-mobipocket-ebook",
  epub: "application/epub+zip",
  txt: "text/plain",
  html: "text/html",
  pjson: "application/json",
  log: "text/plain",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  gif: "image/gif",
  weba: "audio/webm",
  m4a: "audio/mp4",
}

const mimeToExtension: Record<string, string> = Object.entries(
  extensionToMime
).reduce((memo, [ext, mime]) => {
  const normalizedMime = mime.toLowerCase()
  if (!memo[normalizedMime]) {
    memo[normalizedMime] = ext
  }
  return memo
}, {} as Record<string, string>)

const defaultExtensions: Record<UploadType, string> = {
  image: "png",
  audio: "wav",
  json: "json",
}

export function normalizeContentType(value?: string | null): string | null {
  if (!value) {
    return null
  }
  return value.split(";")[0].trim().toLowerCase() || null
}

export function getExtensionFromMime(
  mimeType?: string | null
): string | null {
  const normalized = normalizeContentType(mimeType)
  if (!normalized) {
    return null
  }
  return mimeToExtension[normalized] ?? null
}

export function getMimeFromExtension(extension?: string | null): string | null {
  if (!extension) {
    return null
  }
  const normalized = extension.replace(/^\./, "").toLowerCase()
  return extensionToMime[normalized] ?? null
}

export function getDefaultExtension(type: UploadType): string {
  return defaultExtensions[type]
}
