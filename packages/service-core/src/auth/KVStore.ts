import {
  KVStoreDriver,
  KVStoreOptions,
  NonceRecord,
  Session,
  VCodeRecord,
} from "../types"
import { MemoryStore } from "./MemoryStore"
import { RedisStore } from "./RedisStore"

export class KVStore<TValue> implements KVStoreDriver<TValue> {
  private constructor(private readonly store: KVStoreDriver<TValue>) {}

  static async create<TValue>(
    options: KVStoreOptions
  ): Promise<KVStore<TValue>> {
    const { redisUrl = process.env.REDIS_URL, prefix } = options
    if (!prefix) {
      throw new Error("KVStore prefix is required")
    }
    console.log("[KVStore:create:start]", prefix, !!redisUrl)
    if (redisUrl) {
      const redisStore = new RedisStore<TValue>(redisUrl, prefix)
      try {
        await redisStore.ready
        console.log("[KVStore:create:redis]", prefix)
        return new KVStore(redisStore)
      } catch (error) {
        console.warn(
          "[KVStore:create:fallback-memory]",
          prefix,
          error
        )
      }
    }

    console.log("[KVStore:create:memory]", prefix)
    return new KVStore(new MemoryStore<TValue>())
  }

  set(token: string, value: TValue, ttlSeconds: number) {
    return this.store.set(token, value, ttlSeconds)
  }

  get(token: string) {
    return this.store.get(token)
  }

  delete(token: string) {
    return this.store.delete(token)
  }

  static async nonceStore() {
    return await KVStore.create<NonceRecord>({
      prefix: "nonce",
    })
  }

  static async sessionStore() {
    return await KVStore.create<Session>({
      prefix: "session",
    })
  }

  static async vcodeStore() {
    return await KVStore.create<VCodeRecord>({
      prefix: "vcode",
    })
  }

  static async nonceRateLimitStore() {
    return await KVStore.create<number>({
      prefix: "nonce-ip-limit",
    })
  }
}
