import { Msg } from "@pmate/meta"
import { ChunkResultV2, ChunkServiceV2 } from "@sdk/api/ChunkServiceV2"
import { profileAtom } from "@pmate/account-sdk"
import { ThreadUtils } from "@sdk/util/ThreadUtils"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { clientMessagesAtom } from "./clientMessagesAtom"

export type ThreadMessagesV2AtomParams = {
  entityId: string
  threadHash: string
}

interface ThreadMessageListState {
  remotePages: ChunkResultV2<Msg<any>>[]
}

const PAGE_SIZE = 100
const EMPTY_THREAD_MESSAGES: ThreadMessages = {
  pages: [],
  hasPrevious: false,
}
export interface ThreadMessages {
  pages: {
    messages: Msg<any>[]
  }[]
  hasPrevious: boolean
}

const buildThreadQuery = (
  entityId: string,
  threadHash: string,
  page?: number
) => ({
  user: entityId,
  threadHash,
  ...(page !== undefined ? { page } : {}),
})

export type ThreadMessagesV2AtomAction =
  | {
      type: "loadOlder"
    }
  | {
      type: "loadNewer"
    }

export const threadMessagesV2Atom = atomFamily(
  ({ entityId, threadHash }: ThreadMessagesV2AtomParams) => {
    const baseAtom = atom<ThreadMessageListState>({
      remotePages: [],
    })

    const atomWithActions = atom(
      (get): ThreadMessages => {
        if (!entityId || !threadHash) {
          return EMPTY_THREAD_MESSAGES
        }
        const { remotePages } = get(baseAtom)
        const profile = get(profileAtom)
        const viewerId = profile?.id ?? ""
        const clientState: Record<string, Msg<any>[]> = viewerId
          ? get(clientMessagesAtom(viewerId))
          : {}
        const clientMsgs = clientState[threadHash] || []
        return buildThreadMessages(remotePages, clientMsgs)
      },
      async (get, set, action: ThreadMessagesV2AtomAction) => {
        if (!entityId || !threadHash) {
          return
        }

        const fetchAndStorePage = async (page?: number) => {
          const chunk = await ChunkServiceV2.request<Msg<any>>(
            "thread",
            "messages",
            buildThreadQuery(entityId, threadHash, page)
          )

          if (!chunk) {
            return null
          }

          set(baseAtom, (prev) => {
            const existingIndex = prev.remotePages.findIndex(
              (entry) => entry.page === chunk.page
            )
            if (existingIndex === -1) {
              return {
                ...prev,
                remotePages: [...prev.remotePages, chunk],
              }
            }
            const remotePages = [...prev.remotePages]
            remotePages[existingIndex] = chunk
            return {
              ...prev,
              remotePages,
            }
          })

          return chunk
        }

        switch (action.type) {
          case "loadOlder": {
            const { remotePages } = get(baseAtom)

            const nextPage = remotePages.length
              ? Math.min(...remotePages.map((page) => page.page)) - 1
              : undefined

            if (nextPage !== undefined && nextPage < 0) {
              return
            }

            await fetchAndStorePage(nextPage)
            break
          }
          case "loadNewer": {
            const { remotePages } = get(baseAtom)

            if (!remotePages.length) {
              const latestChunk = await fetchAndStorePage()
              if (!latestChunk) {
                break
              }
              const previousPage = latestChunk.page - 1
              if (previousPage >= 0) {
                const hasPreviousLoaded = get(baseAtom).remotePages.some(
                  (page) => page.page === previousPage
                )
                if (!hasPreviousLoaded) {
                  await fetchAndStorePage(previousPage)
                }
              }
              break
            }

            const pageToFetch = remotePages.length
              ? (() => {
                  const maxPage = Math.max(
                    ...remotePages.map((page) => page.page)
                  )
                  const maxPageEntry = remotePages.find(
                    (page) => page.page === maxPage
                  )
                  if (
                    maxPageEntry &&
                    maxPageEntry.data.length < maxPageEntry.pageSize
                  ) {
                    return maxPage
                  }
                  return maxPage + 1
                })()
              : undefined

            await fetchAndStorePage(pageToFetch)
            break
          }
        }
      }
    )

    atomWithActions.onMount = (setAtom) => {
      if (!entityId || !threadHash) {
        return
      }
      setAtom({ type: "loadNewer" })
    }

    return atomWithActions
  },
  (a, b) => a.entityId === b.entityId && a.threadHash === b.threadHash
)

const buildThreadMessages = (
  remotePages: ChunkResultV2<Msg<any>>[],
  clientMsgs: Msg<any>[]
): ThreadMessages => {
  const remoteMsgs = remotePages.flatMap((page) => page.data || [])
  const combinedLogs = [...remoteMsgs, ...clientMsgs].sort((a, b) => a.t - b.t)
  const aggregated = ThreadUtils.aggregateThreadLogs(combinedLogs)
  const pages = ThreadUtils.paginateMessages(aggregated, PAGE_SIZE)
  const hasPrevious = !remotePages.some((page) => page.page === 0)
  return {
    pages,
    hasPrevious,
  }
}
