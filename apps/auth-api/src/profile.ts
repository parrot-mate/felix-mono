import { blockchain } from "./blockchain"
import {
  Account,
  CreateProfileRequest,
  Profile,
  ProfileScope,
  TS_LogKind,
  TopicNames,
  UpdateProfileRequest,
  UserRole,
} from "@pmate/meta"
import {
  IndexerQuery,
  TSLogBuilder,
  genSubAccountName,
  generateAddress,
  mappingKeys,
} from "@pmate/service-core"

const generateUserName = async (
  role: UserRole = "practitioner"
): Promise<string> => {
  const prefix = role === "practitioner" ? "P" : "M"
  while (true) {
    const digits = Math.random().toString().slice(2, 10)
    const userName = `${prefix}-${digits}`
    const key = mappingKeys.userProfile(userName)
    const profileId = await IndexerQuery.getMappedValue<string>(key)
    if (!profileId) {
      return userName
    }
  }
}

export const getProfiles = async (req: ProfileScope): Promise<Profile[]> => {
  return await IndexerQuery.profiles<Profile>(req.app, req.account)
}

export const createProfile = async (
  req: CreateProfileRequest
): Promise<Profile> => {
  const info = await IndexerQuery.entity<Account>(req.account)
  if (!info) {
    throw new Error("用户不存在")
  }

  const name = genSubAccountName()
  const role = req.role ?? "practitioner"
  const learningTargetLang = req.learningTargetLang ?? "en"
  const userName = await generateUserName(role)
  const profile: Profile = {
    id: "",
    app: req.app,
    account: req.account,
    name,
    userName,
    nickName: req.nickName,
    avatar: "",
    motherTongue: "zh-CN",
    learningTargetLang,
    role,
  }
  profile.id = generateAddress()

  const mapLog = TSLogBuilder.mapping({
    key: mappingKeys.userProfile(profile.userName),
    value: profile.id,
  })
  const infoLog = TSLogBuilder.entityCreated<Profile>({
    kind: TS_LogKind.Entity_PROFILE,
    topic: TopicNames.profiles(),
    entity: profile,
  })

  await blockchain.appendBatch([mapLog, infoLog])
  return profile
}

export const updateProfile = async (req: UpdateProfileRequest) => {
  const { profileId, ...payload } = req
  const changes = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  )

  if (!profileId || Object.keys(changes).length === 0) {
    return
  }

  await blockchain.append(
    TSLogBuilder.entityUpdated<Profile>({
      id: profileId,
      topic: TopicNames.profiles(),
      kind: TS_LogKind.Entity_PROFILE,
      updated: changes,
    })
  )
}

export const findProfileByUserName = async (
  userName: string
): Promise<string | undefined> => {
  return await IndexerQuery.getMappedValue<string>(
    mappingKeys.userProfile(userName)
  )
}
