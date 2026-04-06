import { Maybe, isMaybe } from "@pmate/utils"
import { cacheInMem } from "./cacheInMem"

export const apiGETLogFile = async <T>(url: string) => {
  try {
    const r = await fetch(url)
    if (r.status !== 200) {
      return Maybe.Nothing()
    }
    const text = await r.text()
    const logs = text
      .split("\n")
      .filter((x) => x)
      .map((x) => JSON.parse(x) as T)
    return Maybe.Just(logs)
  } catch (e) {
    return Maybe.Nothing()
  }
}

const _checkLinkExists = async (url: string | Maybe<string>) => {
  if (isMaybe(url)) {
    if (url.isNothing()) {
      return false
    }
    url = url.unwrap()
  }
  try {
    const response = await fetch(url, {
      method: "HEAD",
    })
    return response.ok
  } catch (ex) {
    return false
  }
}

export const checkLinkExists = cacheInMem(
  _checkLinkExists,
  "link",
  60 * 60 * 1000
)
