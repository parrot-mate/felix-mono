import { normalizeLang } from "@pmate/lang"
import { LangShort } from "@pmate/meta"
import { AccountManagerV2, resolveAppId } from "@pmate/account-sdk"
import {
  getIndexer,
  IndexerNames,
  UserLogIndexer,
} from "@pmate/sdk"

export async function getUserLang(): Promise<LangShort> {
  const user = await AccountManagerV2.get(resolveAppId()).getLocalProfile()
  if (!user?.id) {
    return "zh-CN"
  }

  const indexer = getIndexer(IndexerNames.UserLogs, user.id) as UserLogIndexer

  await indexer.init()
  const agg = indexer.fetch()
  const lang = agg?.settings["uiLang"]
  return normalizeLang(lang, "zh-CN")
}
