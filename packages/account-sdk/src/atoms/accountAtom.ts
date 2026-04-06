import { atom } from "jotai"
import {
  AccountLifecycleState,
  AccountSnapshot as AccountSnapshotType,
} from "../types/account.types"

export type AccountSnapshot = AccountSnapshotType

const emptySnapshot: AccountSnapshot = {
  state: AccountLifecycleState.Idle,
  profiles: [],
  profile: null,
  accountId: null,
  account: null,
  error: null,
}

export const accountAtom = atom<AccountSnapshot>(emptySnapshot)
