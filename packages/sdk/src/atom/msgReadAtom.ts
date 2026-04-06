import { ThreadService } from "@sdk/api"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"

type MsgReadPayload = {
  user: string
  threadHash: string
  hash: string
}

const msgReadCacheAtom = atomFamily((_: MsgReadPayload) => {
  return atom(false)
}, isEqual)

export const msgReadAtom = atomFamily((params: MsgReadPayload) => {
  return atom(async (get) => {
    const cacheAtom = msgReadCacheAtom(params)

    if (get(cacheAtom)) {
      return true
    }

    const result = await ThreadService.getRead({
      user: params.user,
      threadHash: params.threadHash,
      hash: params.hash,
    })

    return Boolean(result)
  })
}, isEqual)

export const msgReportReadAtom = atom(
  null,
  async (get, set, payload: MsgReadPayload) => {
    const cacheAtom = msgReadCacheAtom(payload)

    if (get(cacheAtom)) {
      return
    }

    set(cacheAtom, true)

    try {
      await ThreadService.reportReadMsg({
        userId: payload.user,
        threadHash: payload.threadHash,
        hash: payload.hash,
      })
    } catch (error) {
      set(cacheAtom, false)
      throw error
    }
  }
)
