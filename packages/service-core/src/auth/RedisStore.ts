import { createClient, type RedisClientType } from "@redis/client"

export class RedisStore<TValue> {
  private readonly client: RedisClientType
  private readonly prefix: string
  readonly ready: Promise<void>

  constructor(redisUrl: string, prefix: string) {
    this.prefix = prefix.endsWith(":") ? prefix.slice(0, -1) : prefix
    this.client = createClient({ url: redisUrl })
    this.client.on("error", (error) => {
      console.error("[RedisStore:error]", this.prefix, error)
    })
    this.client.on("end", () => {
      console.warn("[RedisStore:end]", this.prefix)
    })
    this.client.on("reconnecting", () => {
      console.warn("[RedisStore:reconnecting]", this.prefix)
    })
    console.log("[RedisStore:connect:start]", this.prefix, redisUrl)
    this.ready = this.client.connect().then(() => {
      console.log("[RedisStore:connect:ok]", this.prefix)
    })
  }

  private key(token: string) {
    return `${this.prefix}:${token}`
  }

  async set(token: string, value: TValue, ttlSeconds: number) {
    console.log("[RedisStore:set:start]", this.prefix, token, ttlSeconds)
    await this.client.set(this.key(token), JSON.stringify(value), {
      EX: Math.max(1, Math.floor(ttlSeconds)),
    })
    console.log("[RedisStore:set:ok]", this.prefix, token)
  }

  async get(token: string) {
    console.log("[RedisStore:get:start]", this.prefix, token)
    const raw = await this.client.get(this.key(token))
    console.log("[RedisStore:get:ok]", this.prefix, token, !!raw)
    if (!raw) return null
    try {
      return JSON.parse(raw) as TValue
    } catch {
      console.warn("[RedisStore:get:parse-failed]", this.prefix, token)
      return null
    }
  }

  async delete(token: string) {
    console.log("[RedisStore:delete:start]", this.prefix, token)
    await this.client.del(this.key(token))
    console.log("[RedisStore:delete:ok]", this.prefix, token)
  }
}
