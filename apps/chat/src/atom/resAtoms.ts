import { apiGetDict } from "@pmate/sdk"
import { atom } from "jotai"

export const zhCNDictAtom = atom(async () => {
  return await apiGetDict("zh-CN")
})

export const enDictAtom = atom(async () => {
  return await apiGetDict("en")
})
