import { uploadFileToOSS, uploadJsonToOSS } from "./alioss"
import { UploadRouteConfig } from "./upload.configs"
import { UploadPayload } from "./uploadRequest"

export type UploadHandler = (
  config: UploadRouteConfig,
  payload: UploadPayload
) => Promise<string | void>

export const handleImageUpload: UploadHandler = async (
  config,
  payload
) => {
  return uploadBinary(config, payload)
}

export const handleAudioUpload: UploadHandler = async (
  config,
  payload
) => {
  const url = await uploadBinary(config, payload)
  if (payload.text) {
    await uploadJsonToOSS(
      `users/${payload.user}/${config.prefix}/${payload.hash}.json`,
      {
        text: payload.text,
        uploadedAt: Date.now(),
      }
    )
  }
  return url
}

export const handleJsonUpload: UploadHandler = async (
  config,
  payload
) => {
  if (payload.jsonBody) {
    const key = buildObjectKey(config, payload)
    return uploadJsonToOSS(key, payload.jsonBody)
  }

  return uploadBinary(config, payload)
}

async function uploadBinary(
  config: UploadRouteConfig,
  payload: UploadPayload
) {
  const key = buildObjectKey(config, payload)
  return uploadFileToOSS(key, payload.data, payload.contentType)
}

function buildObjectKey(config: UploadRouteConfig, payload: UploadPayload) {
  return `users/${payload.user}/${config.prefix}/${payload.hash}.${payload.extension}`
}
