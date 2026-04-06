import type { VCodeFor } from "@pmate/meta"

export type AuthType = "sms" | "wechat" | "email" | "eip155"
export type SMSAuthRequestBody = {
  type: "sms"
  mobile: string
  vcode: string
}

export type WechatAuthRequestBody = {
  type: "wechat"
  code: string
  state?: string
}

export type AuthRequestBody = SMSAuthRequestBody | WechatAuthRequestBody

export interface AuthRequest {
  body: AuthRequestBody
  nonce: string
  issuedAt: string
  app?: string
}

export type AuthVerificationContext = {
  type: AuthType
  mobile: string
  purpose: VCodeFor
}

export interface AuthIdentity {
  accountId: string
}

export interface Session {
  identity: AuthIdentity
  issuedAt: string
  expiresAt: string
}

export type SessionContext = {
  token: string
  session: Session
}

export type LoginResponse = Session & {
  session: string
}

export type NonceStatus = {
  exists: boolean
  used: 0 | 1
}

export type VCodeRecord = {
  nonce: string
  channel: AuthType
  mobile: string
  code: string
  issuedAt: string
  expiresAt: string
  purpose: VCodeFor
  ipAddress?: string
  consumedAt?: string
}

export type VCodeIssueRequest = {
  mobile: string
  purpose: VCodeFor
}

export type VCodeIssueResult = {
  nonce: string
  issuedAt: string
  expiresAt: string
}

export type KVStoreDriver<TValue> = {
  set(token: string, value: TValue, ttlSeconds: number): Promise<void>
  get(token: string): Promise<TValue | null>
  delete(token: string): Promise<void>
}

export type KVStoreOptions = {
  redisUrl?: string
  prefix: string
}

export type NonceRecord = {
  issuedAt: string
  used: 0 | 1
  ipAddress?: string
}

export type SignatureVerificationParams = {
  identity: AuthIdentity
  message: string
  signature: string
}
