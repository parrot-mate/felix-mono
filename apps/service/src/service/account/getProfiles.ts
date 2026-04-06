import { Profile, ProfileScope } from "@pmate/meta"
import { IndexerQuery } from "@pmate/service-core"

export const getProfiles = async (req: ProfileScope): Promise<Profile[]> => {
  return await IndexerQuery.profiles<Profile>(req.app, req.account)
}
