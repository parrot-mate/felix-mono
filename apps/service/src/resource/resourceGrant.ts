import { ResourceTypes } from "@pmate/meta"

interface UserResourceGrant {
  type: ResourceTypes
  expires: number
  grantParams: string[]
}

export const grantResource = (
  grants: UserResourceGrant[],
  type: ResourceTypes,
  ...args: string[]
) => {
  grants = grants
    .filter((x) => x.type === type)
    .filter((x) => x.expires > Date.now())

  if (grants.length === 0) return false

  return true
  // for (const grant of grants) {
  //   if (checkGrant(grant, type, ...args)) {
  //     return true
  //   }
  // }
  // return false
}

// const checkGrant = (
//   grant: UserResourceGrant,
//   type: ResourceTypes,
//   ...args: string[]
// ) => {
//   switch (type) {
//     case "image":
//     case "word": {
//       return grant.grantParams[0] === "*"
//     }
//     case "book-analyze":
//     case "book-tts":
//       return grant.grantParams.includes(args[0])
//   }
// }
