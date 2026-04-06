import { atomWithProxy } from "jotai-valtio"
import { proxy } from "valtio/vanilla"

export const networkState = proxy({ offline: false })

export const networkStateAtom = atomWithProxy(networkState)
