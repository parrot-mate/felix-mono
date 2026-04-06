import { Msg } from "@pmate/meta"
import { ThreadUtils } from "@sdk/util/ThreadUtils"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

type ClientMessages = Record<string, Msg<any>[]>

type ClientMessagesAtomAction = {
  type: "append"
  msg: Msg<any>
}

export const clientMessagesAtom = atomFamily(
  (userId: string) => {
    const baseAtom = atom<ClientMessages>({})

    return atom(
      (get) => get(baseAtom),
      (_get, set, action: ClientMessagesAtomAction) => {
        if (!userId) {
          return
        }
        switch (action.type) {
          case "append": {
            set(baseAtom, (prev) => {
              try {
                const threadHash = ThreadUtils.threadHashFromMsg(action.msg)
                const threadMsgs = prev[threadHash] || []
                return {
                  ...prev,
                  [threadHash]: [...threadMsgs, action.msg],
                }
              } catch {
                return prev
              }
            })
            break
          }
        }
      }
    )
  },
  (a, b) => a === b
)
