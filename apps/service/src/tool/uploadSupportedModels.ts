import { Models } from "@pmate/service-utils"
import { POSS } from "../util/alioss"

const uploadPrompts = async () => {
  await POSS.publicOSS.uploadJsonToOSS(
    `prompts/models.json`,
    Object.keys(Models).map((key) => {
      const model = Models[key as keyof typeof Models]
      return {
        key: model.key,
        type: model.type,
      }
    })
  )
}

uploadPrompts()
