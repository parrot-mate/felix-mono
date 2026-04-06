import { TS_Log_Init } from "@pmate/meta"
import { Api } from "./Api"

export const apiAppendUserLog = async (
  logs: TS_Log_Init<any>[]
): Promise<void> => {
  const endpoint = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!
  await Api.post(`${endpoint}/user-logs`, { logs })
}
