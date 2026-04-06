const MOBILE_MAPPING_PREFIX = "user-mobile-mapping"
const USERNAME_MAPPING_PREFIX = "username-mapping"

export const mappingKeys = {
  mobileAccount: (mobile: string) => `${MOBILE_MAPPING_PREFIX}:${mobile}`,
  userProfile: (userName: string) => `${USERNAME_MAPPING_PREFIX}:${userName}`,
}

export type MappingKeyBuilder = typeof mappingKeys
