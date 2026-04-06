import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { lastReadTimeAtom } from "./lastReadTimeAtom"

export const enterThreadAtom = atomFamily((threadHash: string) =>
  atom(null, (_, set) => {
    set(lastReadTimeAtom(threadHash), Date.now())
  })
)
