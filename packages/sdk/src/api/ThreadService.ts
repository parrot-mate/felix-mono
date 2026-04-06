import { batchResolver } from "@pmate/utils"
import type { ThreadInfoV2, UserReadMessageLog } from "@pmate/meta"
import { Api } from "./Api"

const ACCOUNT_ENDPOINT = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!

export class ThreadService {
  public static async getThreads(user: string): Promise<ThreadInfoV2[]> {
    if (!user) {
      return []
    }
    const url = `${ACCOUNT_ENDPOINT}/threads?user=${encodeURIComponent(user)}`
    return (await Api.get<ThreadInfoV2[]>(url)) ?? []
  }

  public static async getThread(
    user: string,
    threadHash: string
  ): Promise<ThreadInfoV2 | null> {
    if (!user || !threadHash) {
      return null
    }
    const url = `${ACCOUNT_ENDPOINT}/thread/${encodeURIComponent(
      user
    )}/${encodeURIComponent(threadHash)}`
    return await Api.get<ThreadInfoV2>(url)
  }

  public static async reportReadMsg(
    ...entries: UserReadMessageLog[]
  ): Promise<void> {
    if (!entries.length) {
      return
    }

    const url = `${ACCOUNT_ENDPOINT}/msg/read`
    try {
      await Api.post<string>(url, entries)
    } catch (error) {
      console.warn("Failed to report read message", error)
    }
  }

  public static getRead = batchResolver({
    windowMs: 200,
    resolver: async (
      inputs: {
        user: string
        threadHash: string
        hash: string
      }[]
    ) => {
      const threadHash = inputs[0].threadHash
      const user = inputs[0].user
      const hashes = inputs.map((x) => x.hash)

      const url = `${ACCOUNT_ENDPOINT}/msg/thread-read`
      const result = await Api.post<boolean[]>(url, {
        user,
        threadHash,
        hashes,
      })
      return result
    },
  })
}
