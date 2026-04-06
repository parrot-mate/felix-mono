import { aiGenImage as fetchAIImage } from "@pmate/sdk"
import { AIImgRequest } from "@pmate/meta"
import { uniqHashForAIImage } from "@pmate/utils"
import { atomFamily } from "jotai/utils"
import { atomWithRetry } from "../atomWithRetry"

export const aiImageAtom = atomFamily(
  (params: AIImgRequest<any>) => {
    return atomWithRetry(async () => {
      const url = await fetchAIImage(params)
      return url
    })
  },
  (a, b) => {
    return uniqHashForAIImage(a) === uniqHashForAIImage(b)
  }
)
