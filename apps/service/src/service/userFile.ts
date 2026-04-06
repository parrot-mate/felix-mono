import { IUserLog } from "@pmate/meta"
import { LogAppender } from "../util/LogAppender"
import { POSS } from "../util/alioss"
import { OSSKeys } from "@pmate/meta"

export const setFileData = async (user: string, key: string, data: any) => {
  await POSS.publicOSS.uploadJsonToOSS(OSSKeys.file(user, key), data)
}

export const reportUserLog = async <T extends IUserLog>(
  user: string,
  logFile: string,
  logs: T | T[]
) => {
  if (!Array.isArray(logs)) {
    logs = [logs]
  }
  logs.forEach((x) => (x.t = new Date().getTime()))

  return await Promise.all(
    logs.map((log) => {
      return LogAppender.get<T>(OSSKeys.log(user, logFile)).append(log)
    })
  )
}
