import { EmitterV2 } from "@pmate/utils"
import {
  AccountState,
  LangShort,
  LocalProfileState,
  Profile,
  RoomPeerInfo,
} from "@pmate/meta"
import { AccountLifecycleState } from "../types/account.types"
import type { AccountSnapshot } from "../types/account.types"
import { AccountService, ProfileService } from "../api"
import { clearAccountState, setAccountState } from "./accountStorage"
import { resolveAppId } from "./resolveAppId"
import {
  clearSelectedProfileId,
  getSelectedProfileId,
  setSelectedProfileId,
} from "./selectedProfileStorage"
import { clearAuthToken, getAuthToken, setAuthToken } from "./tokenStorage"

export enum AccountManagerEvent {
  StateChange = "stateChange",
}

export type AccountManagerEventMap = {
  [AccountManagerEvent.StateChange]: void
}

export class AccountManagerV2 extends EmitterV2<AccountManagerEventMap> {
  private static instances = new Map<string, AccountManagerV2>()
  private static readonly PROFILE_SYNC_ATTEMPTS = 8
  private static readonly PROFILE_SYNC_DELAY_MS = 250

  constructor(private readonly app: string) {
    super()
  }

  public static get(app?: string): AccountManagerV2 {
    const resolvedApp = resolveAppId(app)
    const existing = AccountManagerV2.instances.get(resolvedApp)
    if (existing) {
      return existing
    }
    const manager = new AccountManagerV2(resolvedApp)
    AccountManagerV2.instances.set(resolvedApp, manager)
    return manager
  }

  public async session() {
    try {
      return await AccountService.session(undefined, this.app)
    } catch (error) {
      return null
    }
  }

  public async login(): Promise<AccountState> {
    this.transition(AccountLifecycleState.LoggingIn, null)
    try {
      const session = await AccountService.session(undefined, this.app)
      if (!session) {
        throw new Error("Session not found")
      }
      const issuedAtMs = Date.parse(session.issuedAt)
      const state: AccountState = {
        accountId: session.identity.accountId,
        token: "",
        signTime: Number.isNaN(issuedAtMs) ? Date.now() : issuedAtMs,
        app: this.app,
      }
      this.setAccountState(state)
      this.transition(AccountLifecycleState.Authenticated, null)
      this.transition(AccountLifecycleState.ProfileInitializing, null)
      const profiles = await this.prepareProfiles(state)
      this.transition(
        profiles.length > 0
          ? AccountLifecycleState.ProfileReady
          : AccountLifecycleState.ProfileUninitialized,
        null,
      )
      return state
    } catch (error) {
      const nextError =
        error instanceof Error ? error : new Error("Login failed")
      this.transition(AccountLifecycleState.Error, nextError)
      throw nextError
    }
  }

  public hasUrlSession(): boolean {
    if (typeof window === "undefined") {
      return false
    }
    const params = new URLSearchParams(window.location.search)
    return params.has("sessionId")
  }

  /**
   * When a URL contains a sessionId parameter, this method logs in the user.
   * If URL does not contain a sessionId parameter, this method logs in from existing session.
   */
  public async loginUrlSessionOverride(): Promise<AccountState> {
    if (typeof window === "undefined") {
      return this.login()
    }
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get("sessionId")
    if (sessionId) {
      this.setAuthToken(sessionId)
    }
    const account = await this.login()
    if (sessionId) {
      params.delete("sessionId")
      const nextSearch = params.toString()
      const nextUrl = `${window.location.pathname}${
        nextSearch ? `?${nextSearch}` : ""
      }${window.location.hash}`
      window.history.replaceState(null, "", nextUrl)
    }
    return account
  }

  public async logout(): Promise<void> {
    this.transition(AccountLifecycleState.LoggingOut, null)
    try {
      await AccountService.logout(getAuthToken(this.app) || undefined, this.app)
    } catch {
      // ignore logout failures to ensure local session is cleared
    } finally {
      this.clearSession()
      this.transition(AccountLifecycleState.Unauthenticated, null)
    }
  }

  public async getSnapshot(): Promise<AccountSnapshot> {
    const account = await this.getAccountState()
    if (!account) {
      return {
        state: AccountLifecycleState.Unauthenticated,
        account: null,
        accountId: null,
        error: null,
        profiles: [],
        profile: null,
      }
    }
    const profiles = await this.getProfiles()
    const profile = await this.getSelectedProfile(profiles)
    const state =
      profiles.length > 0
        ? AccountLifecycleState.ProfileReady
        : AccountLifecycleState.ProfileUninitialized
    return {
      state,
      account,
      accountId: account.accountId ?? null,
      error: null,
      profiles,
      profile,
    }
  }

  public transition(next: AccountLifecycleState, error?: Error | null): void {
    void next
    void error
    this.emit(AccountManagerEvent.StateChange)
  }

  public async getAccountState(): Promise<AccountState | null> {
    const session = await this.session()
    if (!session) {
      return null
    }
    const issuedAtMs = Date.parse(session.issuedAt)
    const state: AccountState = {
      accountId: session.identity.accountId,
      token: getAuthToken(this.app) || "",
      signTime: Number.isNaN(issuedAtMs) ? Date.now() : issuedAtMs,
      app: this.app,
    }
    return state
  }

  public setAccountState(state: AccountState): void {
    setAccountState(state, this.app)
  }

  public clearAccountState(): void {
    clearAccountState(this.app)
  }

  public async getSelectedProfile(
    profiles?: Profile[],
  ): Promise<Profile | null> {
    const storedId = getSelectedProfileId(this.app)
    if (!storedId) {
      return null
    }
    const resolvedProfiles = profiles ?? (await this.getProfiles())
    return resolvedProfiles.find((profile) => profile.id === storedId) ?? null
  }

  public setSelectedProfile(
    profile: Profile | LocalProfileState | string,
  ): void {
    const nextId = typeof profile === "string" ? profile : profile.id
    setSelectedProfileId(nextId, this.app)
    this.emit(AccountManagerEvent.StateChange)
  }

  public clearSelectedProfile(): void {
    clearSelectedProfileId(this.app)
    this.emit(AccountManagerEvent.StateChange)
  }

  public async getProfiles(): Promise<Profile[]> {
    const account = await this.getAccountState()
    if (!account) {
      return []
    }
    try {
      return await this.prepareProfiles(account)
    } catch {
      return []
    }
  }

  public clearProfiles(): void {
    this.emit(AccountManagerEvent.StateChange)
  }

  public clearSession(): void {
    this.clearAccountState()
    this.clearSelectedProfile()
    this.clearProfiles()
    this.clearAuthToken()
  }

  public getAuthToken(): string | null {
    return getAuthToken(this.app)
  }

  public setAuthToken(token: string): void {
    setAuthToken(token, this.app)
    AccountService.clearSessionCache()
    this.emit(AccountManagerEvent.StateChange)
  }

  public clearAuthToken(): void {
    clearAuthToken(this.app)
    AccountService.clearSessionCache()
    this.emit(AccountManagerEvent.StateChange)
  }

  public async getLocalProfile(): Promise<LocalProfileState | null> {
    const account = await this.getAccountState()
    const profile = await this.getSelectedProfile()
    if (!account || !profile) {
      return null
    }
    const { id, ...rest } = profile
    return { ...account, ...rest, id } as LocalProfileState
  }

  public async getCurrentPeer(): Promise<RoomPeerInfo | undefined> {
    const user = await this.getLocalProfile()
    if (!user) {
      return
    }
    return {
      ...user,
      gender: user.gender ?? "",
      email: user.email || "",
      isOnline: true,
    } as RoomPeerInfo
  }

  public async createProfile(payload: {
    nickName: string
    learningTargetLang?: LangShort
  }): Promise<Profile> {
    const account = await this.getAccountState()
    if (!account) {
      throw new Error("Account info is missing for profile creation")
    }
    const profile = await ProfileService.createProfile({
      app: resolveAppId(account.app),
      account: account.accountId,
      nickName: payload.nickName,
      learningTargetLang: payload.learningTargetLang,
    })
    await this.waitForProfileSync(account, profile.id)
    if (!(await this.getSelectedProfile())) {
      this.setSelectedProfile(profile)
    }
    return profile
  }

  private async waitForProfileSync(
    account: AccountState,
    profileId: string,
  ): Promise<void> {
    for (
      let attempt = 0;
      attempt < AccountManagerV2.PROFILE_SYNC_ATTEMPTS;
      attempt += 1
    ) {
      const profiles = await this.prepareProfiles(account)
      if (profiles.some((profile) => profile.id === profileId)) {
        return
      }
      if (attempt < AccountManagerV2.PROFILE_SYNC_ATTEMPTS - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, AccountManagerV2.PROFILE_SYNC_DELAY_MS),
        )
      }
    }
  }

  private async prepareProfiles(account: AccountState): Promise<Profile[]> {
    const profiles = await ProfileService.getProfiles(account)
    const storedId = getSelectedProfileId(this.app)
    if (storedId && profiles.some((profile) => profile.id === storedId)) {
      return profiles
    }
    const nextSelected = profiles[0]
    if (nextSelected) {
      this.setSelectedProfile(nextSelected)
    } else {
      this.clearSelectedProfile()
    }
    return profiles
  }
}
