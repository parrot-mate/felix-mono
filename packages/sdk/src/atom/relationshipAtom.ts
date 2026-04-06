import { RelationShipService } from "@sdk/api"
import { AclStatus } from "@pmate/meta"
import type { RelationshipStatus } from "@pmate/meta"
import { atom } from "jotai"
import { atomFamily } from "jotai/utils"

interface Params {
  from: string | undefined
  to: string | undefined
}

const keyEqual = (a: Params, b: Params) => a.from === b.from && a.to === b.to

const verAtom = atomFamily((_: Params) => atom(0), keyEqual)

export const refreshRelationshipAtom = atom(null, (_get, set, params: Params) => {
  set(verAtom(params), (v) => v + 1)
})

export const relationshipAtom = atomFamily(
  (params: Params) =>
    atom(async (get) => {
      const { from, to } = params
      if (!from || !to) return "init" as RelationshipStatus
      get(verAtom(params))
      const status = await RelationShipService.aclStatus(from, to)
      return mapAclToRelationshipStatus(status)
    }),
  keyEqual
)

const mapAclToRelationshipStatus = (
  status: AclStatus
): RelationshipStatus => {
  switch (status) {
    case AclStatus.AllowAgree:
      return "agreed"
    case AclStatus.BlockNotAgree:
      return "requesting"
    case AclStatus.BlockBlacklist:
      return "blocked"
    case AclStatus.AllowFirstMsg:
    default:
      return "init"
  }
}