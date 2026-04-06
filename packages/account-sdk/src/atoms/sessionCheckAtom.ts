import { atom } from "jotai"
import { AccountService } from "../api/AccountService"

export const sessionCheckAtom = atom(null, async () => {
  try {
    return await AccountService.session()
  } catch {
    return null
  }
})
