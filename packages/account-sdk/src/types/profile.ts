import type { Profile } from "@pmate/meta"

export type ProfileDraft = Partial<Profile> & {
  isAdult?: boolean
  age?: number
}
