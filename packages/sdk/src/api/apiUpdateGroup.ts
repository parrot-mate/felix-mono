import { GroupInfo } from "@pmate/meta"
import { Api } from "./Api"

export const apiUpdateGroup = async (payload: Partial<GroupInfo>) => {
  const endpoint = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!
  return await Api.put<string>(`${endpoint}/group`, payload)
}
