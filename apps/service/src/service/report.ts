import { VolcabularyLog } from "@pmate/meta"
import { LogAppender } from "../util/LogAppender"
import { OSSKeys } from "@pmate/meta"

export const reportVolcabulary = async (user: string, log: VolcabularyLog) => {
  log.t = new Date().getTime()
  await LogAppender.get<VolcabularyLog>(OSSKeys.volcabulary(user)).append(log)
}
