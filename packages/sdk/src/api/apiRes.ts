import { Dict, LangShort, SimpleWord } from "@pmate/meta"
import { Api } from "./Api"

const STATIC_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

export const apiGetDict = async (lang: LangShort) => {
  const remoteLang = lang === "zh-CN" ? "cn" : "en"
  const vers = {
    cn: "v1",
    en: "v1.4",
  } as const
  const result = await Api.getFile<SimpleWord[]>(
    `${STATIC_URL}/perm/dict-${remoteLang}-${vers[remoteLang]}.pjson`
  )

  if (!result) {
    return {}
  }

  const dict: Dict = {}
  for (let word of result) {
    dict[word.w] = word
  }
  return dict
}
