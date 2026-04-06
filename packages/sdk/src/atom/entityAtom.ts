import { EntityService } from "@sdk/api"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { isEqual } from "lodash"

type Params = {
  type: "dm" | "group"
  id: string
}

const keyEqual = (a: Params, b: Params) => isEqual(a, b)

export const entityAtom = atomFamily(
  (params: Params) =>
    atom(async () => {
      if (!params.id) {
        return null
      }
      if (params.type === "group") {
        const entity = await EntityService.getGroup(params.id)
        return entity ?? null
      }
      const entity = await EntityService.getProfile(params.id)
      return entity ?? null
    }),
  keyEqual
)
