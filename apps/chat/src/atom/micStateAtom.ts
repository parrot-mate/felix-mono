import { MicState, MicStateManage } from "@/component/chat/MicStateManage"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

export const micStateManageAtom = atomFamily((_id: string) => {
  return atom(new MicStateManage())
})

export const micStateAtom = atomFamily((_id: string) => {
  return atom(MicState.Idle)
})
