import { Maybe, isMaybe, resourceKey, uniqHashForPrompt } from "@pmate/utils"
import { LangShort, Prompt, ResourceTypes } from "@pmate/meta"
import { cacheMethod } from "@sdk/util/cacheMethod"

const STATIC_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

export class Resource {
  static async apiResourceURL(
    type: ResourceTypes,
    ...args: (Maybe<string> | string)[]
  ): Promise<Maybe<string>> {
    const result = await Resource.apiResourceKey(type, ...args)
    return result.map((key) => `${STATIC_URL}/${key}`)
  }

  static async apiResourceKey(
    type: ResourceTypes,
    ...args: (string | Maybe<string>)[]
  ) {
    if (args.find((x) => isMaybe(x) && x.isNothing())) {
      return Maybe.Nothing()
    }
    args = args.map((x) => (isMaybe(x) ? x.unwrap() : x))

    return Resource._apiResourceKey(type, ...(args as string[]))
  }

  static async apiResourceUrlTts(
    provider: string,
    voice: string,
    text: string,
    instructions: string,
    lang: LangShort,
    timePoints: boolean
  ) {
    return Resource.apiResourceURL(
      "tts",
      provider,
      voice,
      text,
      instructions,
      lang,
      timePoints ? "true" : "false"
    )
  }

  static async apiResourceUrlTtsTimepoints(
    provider: string,
    voice: string,
    text: string,
    instructions: string,
    lang: LangShort,
    timePoints: boolean
  ) {
    return (
      await Resource.apiResourceURL(
        "tts",
        provider,
        voice,
        text,
        instructions,
        lang,
        timePoints ? "true" : "false"
      )
    ).map((url) => {
      return url.replace(/\.mp3$/, ".align.json")
    })
  }

  static getPromptUrl(prompt: Prompt, variables: Record<string, any>) {
    const url = `${STATIC_URL}/${prompt.key}/${uniqHashForPrompt(
      prompt,
      variables
    )}.json`
    return url
  }

  @cacheMethod({
    expireIn: 1000 * 60 * 60 * 24 * 30,
    type: "indexDB",
  })
  static async _apiResourceKey(type: ResourceTypes, ...args: string[]) {
    try {
      return Maybe.Just(resourceKey(type, ...args))
    } catch (error) {
      return Maybe.Nothing()
    }
  }
}
