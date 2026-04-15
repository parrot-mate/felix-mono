import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { defaultNavigationItems } from "../data/navigation"
import type { NavigationItem } from "../types"

export const navigationItemsAtom = atomWithStorage<NavigationItem[]>(
  "erp-homepage:navigation-items",
  defaultNavigationItems
)

export const selectedNavigationIdAtom = atom<string | null>(null)

export const resetNavigationItemsAtom = atom(null, (_get, set) => {
  set(navigationItemsAtom, defaultNavigationItems)
  set(selectedNavigationIdAtom, null)
})
