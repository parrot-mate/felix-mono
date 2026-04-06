import { IndexerQuery, mappingKeys } from "@pmate/service-core"

export const findProfileByUserName = async (
  userName: string
): Promise<string | undefined> => {
  return await IndexerQuery.getMappedValue<string>(
    mappingKeys.userProfile(userName)
  )
}
