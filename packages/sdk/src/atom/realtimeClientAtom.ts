import { Logger, type RealtimeClient, WebsocketClient } from "@pmate/utils"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual, memoize } from "lodash"
import { profileAtom } from "@pmate/account-sdk"

const logger = Logger.getDebugger("realtimeClientAtom")

export type Endpoint = {
  h3: string
  ws: string
}

export const createEndpoint = (
  h3OrEndpoint: string | Endpoint,
  ws?: string
): Endpoint => {
  if (typeof h3OrEndpoint !== "string") {
    return h3OrEndpoint
  }
  return { h3: h3OrEndpoint, ws: ws ?? h3OrEndpoint }
}

const ensureProtocol = (value: string, protocol: "https" | "wss") => {
  if (!value) {
    return ""
  }
  if (/^[a-z]+:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      url.protocol = `${protocol}:`
      return url.toString()
    } catch {
      return value
    }
  }
  if (value.startsWith("//")) {
    return `${protocol}:${value}`
  }
  return `${protocol}://${value}`
}

export const getRealtimeClient = memoize(
  (endpoint: Endpoint, userId?: string): RealtimeClient => {
    const wsUrl = ensureProtocol(endpoint.ws, "wss")

    logger.log(
      "H3 client disabled; creating WebsocketClient for endpoint:",
      wsUrl
    )
    return new WebsocketClient(`${wsUrl}?userId=${userId ?? ""}`)
  },
  (endpoint: Endpoint) => `${endpoint.h3}|${endpoint.ws}`
)

export const realtimeClientAtom = atomFamily((endpoint: Endpoint) => {
  return atom(async (get) => {
    const profile = await get(profileAtom)
    return getRealtimeClient(endpoint, profile?.id ?? "")
  })
}, isEqual)
