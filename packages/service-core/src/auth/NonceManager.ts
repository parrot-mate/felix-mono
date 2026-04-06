import { NonceRecord, NonceStatus } from "../types"
import { unauthorized } from "./errors"
import { KVStore } from "./KVStore"

export class NonceManager {
  static readonly NONCE_TTL_SECONDS = 24 * 3600 * 14 // 2 weeks
  static readonly MAX_NONCE_AGE_MS = 5 * 60 * 1000 // 5 minutes
  static readonly MAX_NONCE_PER_WINDOW = 10
  static readonly NONCE_WINDOW_SECONDS = 60

  private static nonceStorePromise:
    | Promise<Awaited<ReturnType<typeof KVStore.nonceStore>>>
    | null = null
  private static ipLimitStorePromise:
    | Promise<Awaited<ReturnType<typeof KVStore.nonceRateLimitStore>>>
    | null = null

  static async create(options?: { ipAddress?: string }) {
    console.log("[NonceManager:create:start]", options?.ipAddress ?? "")
    if (options?.ipAddress) {
      console.log("[NonceManager:create:rate-limit:start]", options.ipAddress)
      await NonceManager.enforceIpLimit(options.ipAddress)
      console.log("[NonceManager:create:rate-limit:ok]", options.ipAddress)
    }

    const nonce = NonceManager.generateNonce()
    const issuedAt = new Date().toISOString()
    const record: NonceRecord = {
      issuedAt,
      used: 0,
      ipAddress: options?.ipAddress,
    }
    console.log("[NonceManager:create:store:start]", nonce)
    const store = await NonceManager.getNonceStore()
    await store.set(nonce, record, NonceManager.NONCE_TTL_SECONDS)
    console.log("[NonceManager:create:store:ok]", nonce, issuedAt)
    return { nonce, issuedAt }
  }

  static async consume(nonce: string) {
    const store = await NonceManager.getNonceStore()
    const record = await store.get(nonce)
    if (!record) {
      throw unauthorized("Invalid or expired nonce")
    }

    const issuedAt = record.issuedAt
    const issuedAtMs = issuedAt ? Date.parse(issuedAt) : Number.NaN
    if (!issuedAt) {
      await store.delete(nonce)
      throw unauthorized("Invalid nonce metadata")
    }

    if (Number.isNaN(issuedAtMs)) {
      await store.delete(nonce)
      throw unauthorized("Invalid nonce metadata")
    }

    if (Date.now() - issuedAtMs > NonceManager.MAX_NONCE_AGE_MS) {
      await store.delete(nonce)
      throw unauthorized("Nonce expired")
    }

    if (record.used === 1) {
      throw unauthorized("Nonce already used")
    }

    const updated: NonceRecord = { ...record, used: 1 }
    await store.set(nonce, updated, NonceManager.NONCE_TTL_SECONDS)
    return updated
  }

  static async verify(nonce: string): Promise<NonceStatus> {
    const nonceStore = await NonceManager.getNonceStore()
    const record = await nonceStore.get(nonce)
    if (!record) {
      return { exists: false, used: 0 }
    }

    return { exists: true, used: record.used }
  }

  private static async enforceIpLimit(ipAddress: string) {
    const store = await NonceManager.getIpLimitStore()
    const current = (await store.get(ipAddress)) ?? 0
    if (current >= NonceManager.MAX_NONCE_PER_WINDOW) {
      throw unauthorized("Too many verification attempts")
    }
    await store.set(
      ipAddress,
      current + 1,
      NonceManager.NONCE_WINDOW_SECONDS
    )
  }

  private static generateNonce() {
    return crypto.randomUUID().replace(/-/g, "")
  }

  private static getNonceStore() {
    if (!NonceManager.nonceStorePromise) {
      console.log("[NonceManager:getNonceStore:init]")
      NonceManager.nonceStorePromise = KVStore.nonceStore()
    }
    return NonceManager.nonceStorePromise
  }

  private static getIpLimitStore() {
    if (!NonceManager.ipLimitStorePromise) {
      console.log("[NonceManager:getIpLimitStore:init]")
      NonceManager.ipLimitStorePromise = KVStore.nonceRateLimitStore()
    }
    return NonceManager.ipLimitStorePromise
  }
}
