import { Namespace } from "@pmate/store"

const isLocalDev =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)

const chainId =
  import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID?.trim() || "pmate-test"
const baseUrl =
  import.meta.env.VITE_BLOCKCHAIN_BASE_URL?.trim() ||
  (isLocalDev && typeof window !== "undefined"
    ? window.location.origin
    : "https://qablk01.pmate.chat")
const indexerBaseUrl =
  import.meta.env.VITE_INDEXER_BASE_URL?.trim() ||
  (isLocalDev && typeof window !== "undefined"
    ? window.location.origin
    : "https://qaidx.pmate.chat")
export const navigationTopic =
  import.meta.env.VITE_ERP_NAV_TOPIC?.trim() || "@pmate/erp-homepage-nav"

const matched = /^@([^/]+)\/([^/]+)$/.exec(navigationTopic.trim())
if (!matched) {
  throw new Error(`Invalid navigation topic: ${navigationTopic}`)
}

export const navigationNamespace = matched[1]
export const navigationTableName = matched[2]

export const navigationStore = new Namespace({
  chain: chainId,
  ns: navigationNamespace,
  baseUrl,
  indexerBaseUrl,
})

export const blockchainConfig = {
  chainId,
  baseUrl,
  indexerBaseUrl,
  navigationTopic,
  navigationNamespace,
  navigationTableName,
}
