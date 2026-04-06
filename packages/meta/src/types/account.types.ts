import type { Profile, ProfileInfo } from "./blockchain.types"
import type { LangShort } from "./lang.types"

export type UserRole = "practitioner" | "mate"

export type VCodeFor = "register" | "login"
export interface VCodeVerifyRequest {
  mobile: string
  applyTime: number
  vcode: string
  token: string
  vcodeFor: VCodeFor
}

export interface AccountRegisterRequest {
  mobile: string
}

export interface AccountLoginRequest extends VCodeVerifyRequest {
  /** sub account name */
  name?: string
}

export interface UserToken {
  id: string
  signTime: number
  token: string
}

export interface AccountState {
  accountId: string
  token: string
  signTime: number
  app?: string
}

export type ProfileScope = {
  app: string
  account: string
}

export interface CreateProfileRequest extends ProfileScope {
  nickName: string
  role?: UserRole
  learningTargetLang?: LangShort
}

export type UpdatableProfileKeys = keyof Omit<ProfileInfo, "userName" | "name">

export interface UpdateProfileRequest
  extends Partial<Omit<Profile, "id" | "name" | "userName" | "app" | "account">> {
  profileId: string
}

export type ModifyAccountInfoRequest = UpdateProfileRequest

export interface Account {
  /** unique user id */
  id: string
  /** account create time */
  createdAt: number
  /** register mobile */
  mobile: string
  /** linked third-party  apps */
  app?: string
}

export type LocalProfileState = AccountState & Profile

export interface AccountMapping {
  id: string
}
