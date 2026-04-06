import { Prompt } from "@pmate/meta"
import { Prompts } from "@pmate/service-utils"
import "../env"
import { POSS } from "../util/alioss"

const uploadPrompts = async (prompts: Prompt[]) => {
  await POSS.publicOSS.uploadJsonToOSS(`prompts/default.json`, prompts)
  await Promise.all(
    prompts
      .filter((p) => p.caching)
      .map((prompt) =>
        POSS.publicOSS.uploadJsonToOSS(`prompts/${prompt.key}.json`, prompt)
      )
  )
  console.log("Prompts uploaded successfully")
}

uploadPrompts(Prompts)
