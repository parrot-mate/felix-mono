import type { VCodeFor } from "./account.types"

export type AuthType = "sms" | "wechat" | "email" | "eip155"

export type SMSAuthRequestBody = {
  type: "sms"
  mobile: string
  vcode: string
}

export type AuthRequestBody = SMSAuthRequestBody

export type AuthRequest = {
  body: AuthRequestBody
  nonce: string
  issuedAt: string
  app?: string
}

export type AuthIdentity = {
  accountId: string
}

export type AuthSession = {
  identity: AuthIdentity
  issuedAt: string
  expiresAt: string
}

export type AuthSessionContext = {
  token: string
  session: AuthSession
}

export type AuthLoginResponse = AuthSessionContext & {
  identity: AuthIdentity
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

export type CaptchaVerifyRequest = {
  token: string
  scene?: string
}

export type CaptchaVerifyResult = {
  valid: boolean
}
