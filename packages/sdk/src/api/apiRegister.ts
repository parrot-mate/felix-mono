import { AccountState, VCodeVerifyRequest } from "@pmate/meta"
import { Api } from "./Api"
export const apiRegister = async (body: VCodeVerifyRequest) => {
  const endpoint = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!
  return await Api.post<AccountState>(`${endpoint}/register`, body)
}
