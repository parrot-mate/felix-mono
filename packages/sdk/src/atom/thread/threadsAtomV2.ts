import type { ThreadInfoV2 } from "@pmate/meta"
import { ThreadService } from "@sdk/api"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { threadAtomV2 } from "./threadAtomV2"

export const threadsAtomV2 = atomFamily((userId: string) => {
  const threadHashesAtom = atom<string[]>([])
  return atom(
    (get) => {
      if (!userId) {
        return {}
      }
      const threadHashes = get(threadHashesAtom)
      return threadHashes.reduce<Record<string, ThreadInfoV2>>((acc, hash) => {
        const thread = get(threadAtomV2({ userId, threadHash: hash }))
        if (thread) {
          acc[hash] = thread
        }
        return acc
      }, {})
    },
    async (_, set, threadHash?: string) => {
      if (!userId) {
        set(threadHashesAtom, [])
        return
      }

      if (!threadHash) {
        const threads = await ThreadService.getThreads(userId)
        set(
          threadHashesAtom,
          threads.map((thread) => thread.threadHash)
        )
        threads.forEach((thread) => {
          set(threadAtomV2({ userId, threadHash: thread.threadHash }), thread)
        })
        return
      }

      const latestThread = await ThreadService.getThread(userId, threadHash)

      if (!latestThread) {
        return
      }

      set(threadAtomV2({ userId, threadHash }), latestThread)
      set(threadHashesAtom, (prev) =>
        prev.includes(threadHash) ? prev : [...prev, threadHash]
      )
    }
  )
})
