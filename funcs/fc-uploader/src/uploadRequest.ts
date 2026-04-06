import { keccak256 } from "js-sha3"
import { HttpContext } from "./HttpContext"
import { UploadRouteConfig } from "./upload.configs"
import {
  getDefaultExtension,
  getExtensionFromMime,
  getMimeFromExtension,
  normalizeContentType,
} from "./uploadMeta"

interface LegacyBody {
  user?: string
  base64?: string
  text?: string
  filename?: string
  contentType?: string
  ext?: string
}

export interface UploadPayload {
  user: string
  data: Buffer
  hash: string
  contentType: string
  extension: string
  text?: string
  jsonBody?: Record<string, any> | null
}

export function parseUploadRequest(
  config: UploadRouteConfig,
  context: HttpContext
): UploadPayload {
  const jsonBody = context.tryGetJsonBody<LegacyBody>()
  const query = context.getQuery()
  const user =
    (jsonBody?.user && typeof jsonBody.user === "string" && jsonBody.user) ||
    query?.user ||
    context.getHeader("x-uploader-user") ||
    context.getHeader("x-user") ||
    context.getHeader("x-user-id")

  if (!user) {
    throw new Error("Missing user in upload request")
  }

  const text =
    (jsonBody?.text && typeof jsonBody.text === "string"
      ? jsonBody.text
      : undefined) ||
    query?.text ||
    query?.voiceText ||
    context.getHeader("x-uploader-text")

  const headerContentType = normalizeContentType(
    context.getHeader("content-type")
  )
  const legacyBase64Body =
    jsonBody && typeof jsonBody.base64 === "string" && jsonBody.base64.length
      ? jsonBody
      : null

  let buffer: Buffer | null = null
  let extension: string | null = null
  let mimeType: string | null = headerContentType
  let jsonPayload = jsonBody

  if (legacyBase64Body) {
    jsonPayload = null
    buffer = Buffer.from(legacyBase64Body.base64!, "base64")
    extension =
      getExtensionFromFilename(
        legacyBase64Body.filename ?? "",
        legacyBase64Body.ext
      ) ||
      getExtensionFromMime(legacyBase64Body.contentType) ||
      getExtensionFromMime(headerContentType)

    if (!mimeType || mimeType === "application/json") {
      mimeType =
        legacyBase64Body.contentType ||
        getMimeFromExtension(extension || "") ||
        "application/octet-stream"
    }
  } else if (
    jsonBody &&
    typeof jsonBody === "object" &&
    !Array.isArray(jsonBody) &&
    config.type === "json"
  ) {
    jsonPayload = jsonBody
    const jsonString = JSON.stringify(jsonBody)
    buffer = Buffer.from(jsonString)
    extension = "json"
    mimeType = "application/json"
  } else {
    jsonPayload = null
    buffer = context.getBodyBuffer()
    if (!mimeType) {
      mimeType = "application/octet-stream"
    }
    extension =
      getExtensionFromMime(mimeType) ||
      normalizeExtension(query?.ext) ||
      normalizeExtension(context.getHeader("x-uploader-ext"))
  }

  if (!buffer || !buffer.length) {
    throw new Error("Upload body is empty")
  }

  if (!extension) {
    extension = getDefaultExtension(config.type)
    mimeType = getMimeFromExtension(extension) || mimeType || "application/octet-stream"
  }

  if (!mimeType) {
    mimeType = getMimeFromExtension(extension) || "application/octet-stream"
  }

  const hash = keccak256(buffer)

  return {
    user,
    data: buffer,
    hash,
    contentType: mimeType,
    extension,
    text,
    jsonBody: jsonPayload,
  }
}

function getExtensionFromFilename(
  filename?: string,
  fallbackExt?: string
): string | null {
  if (fallbackExt) {
    return fallbackExt.replace(/^\./, "").toLowerCase()
  }
  if (!filename) {
    return null
  }
  const parts = filename.split(".")
  if (parts.length < 2) {
    return null
  }
  return parts.pop()!.toLowerCase()
}

function normalizeExtension(value?: string | null): string | null {
  if (!value) {
    return null
  }
  return value.replace(/^\./, "").toLowerCase()
}
