import { SocialService } from "@sdk/api"
import type { Room } from "@pmate/meta"
import { atom } from "jotai"
import { atomFamily, unwrap } from "jotai/utils"

const FALLBACK = (prev: Room | null | undefined) => prev ?? null

export const roomAtom = atomFamily((threadHash: string) =>
  unwrap(
    atom(async () => {
      if (!threadHash) {
        return null
      }
      const room = await SocialService.getRoom(threadHash)
      return room ?? null
    }),
    FALLBACK
  )
)
