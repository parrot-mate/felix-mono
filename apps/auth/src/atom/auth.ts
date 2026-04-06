import { atom } from "jotai"
import { client } from "@pmate/auth-client"
import type {
  AuthLoginResponse,
  AuthRequest,
  VCodeIssueRequest,
  VCodeIssueResult,
} from "@pmate/meta"

export const vcodeAtom = atom(
  null,
  async (_get, _set, payload: VCodeIssueRequest): Promise<VCodeIssueResult> => {
    return client.vcode(payload)
  }
)

export const loginAtom = atom(
  null,
  async (_get, _set, payload: AuthRequest): Promise<AuthLoginResponse> => {
    return client.login(payload)
  }
)

export const logoutAtom = atom(
  null,
  async (_get, _set, token?: string): Promise<{ success: boolean }> => {
    return client.logout(token)
  }
)
