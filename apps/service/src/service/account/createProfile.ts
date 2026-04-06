import {
  Account as AccountEntity,
  CreateProfileRequest,
  Profile,
  TopicNames,
  TS_LogKind,
  UserRole,
} from "@pmate/meta"
import {
  IndexerQuery,
  TSLogBuilder,
  genSubAccountName,
  generateAddress,
  mappingKeys,
} from "@pmate/service-core"
import { blockchain } from "../../blockchain"

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

export const createProfile = async (
  req: CreateProfileRequest
): Promise<Profile> => {
  const info = await IndexerQuery.entity<AccountEntity>(req.account)
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
