import { Atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"

export const atomFaimlySafe = <T, TParam>(fn: (param: TParam) => Atom<T>) =>
  atomFamily(fn, (a, b) => isEqual(a, b))
