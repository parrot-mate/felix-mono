import { HttpContext } from "./HttpContext"
import { getUploadRoute } from "./upload.configs"
import {
  handleAudioUpload,
  handleImageUpload,
  handleJsonUpload,
  UploadHandler,
} from "./uploadHandlers"
import { parseUploadRequest } from "./uploadRequest"

interface Context {
  logger: {
    info: (msg: string, data: any) => void
  }
}

const handlerMap: Record<string, UploadHandler> = {
  image: handleImageUpload,
  audio: handleAudioUpload,
  json: handleJsonUpload,
}

export const handler = async (event, context: Context, callback) => {
  const httpContext = new HttpContext(event, callback)
  try {
    const path = httpContext.getPath()
    const method = httpContext.getMethod()

    if (method === "OPTIONS") {
      httpContext.sendSucc(null, 204)
      return
    }

    context.logger.info("req pass path", path)

    const route = getUploadRoute(path)
    if (!route) {
      httpContext.sendError(new Error(`Invalid path ${path}`), 404)
      return
    }
    const payload = parseUploadRequest(route, httpContext)
    const uploadHandler = handlerMap[route.type]
    if (!uploadHandler) {
      throw new Error(`No handler registered for type ${route.type}`)
    }
    const data = await uploadHandler(route, payload)
    httpContext.sendSucc(data ?? null)
  } catch (ex) {
    context.logger.info(`${ex}`, "")
    httpContext.sendError(ex, 500)
    // callback(null, errorResult(ex))
  }
}
