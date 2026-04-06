import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"

export interface BookParams {
  user: string
  bookId: string
}

export const lastPositionVersionAtom = atomFamily(
  (_: BookParams) => atom(0),
  isEqual
)
