import { atom } from "jotai"
import type { ProfileDraft } from "../types/profile"

/**
 * Temporary profile info during registration flow
 */
export const profileDraftAtom = atom<ProfileDraft>({})
