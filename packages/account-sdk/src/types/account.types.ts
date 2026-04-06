import type { AccountState, Profile } from "@pmate/meta"

export enum AccountLifecycleState {
  Idle = "idle",
  Checking = "checking",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
  ProfileUninitialized = "profile-uninitialized",
  ProfileInitializing = "profile-initializing",
  ProfileReady = "profile-ready",
  LoggingIn = "logging-in",
  LoggingOut = "logging-out",
  Error = "error",
}

export type AccountSnapshot = {
  state: AccountLifecycleState
  account: AccountState | null
  accountId: string | null
  error: Error | null
  profiles: Profile[]
  profile: Profile | null
}

export type AuthBehaviors = {
  authBehavior: "redirect" | "prompt"
  requiresAuth: boolean
}
