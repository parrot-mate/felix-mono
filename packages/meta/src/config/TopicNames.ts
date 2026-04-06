import type {
  Contact,
  GroupInfo,
  PM_Log,
  Profile,
  RoomBasic,
} from "../types"
import { TS_LogKind } from "../types"

export type RoomsTopicLog = PM_Log<RoomBasic>
export type UserContactsTopicLog = PM_Log<Contact>
export type ProfilesTopicLog = PM_Log<Profile>
export type GroupsTopicLog = PM_Log<GroupInfo>

export class TopicNames {
  static rooms() {
    return "@pmate/rooms"
  }

  static userThreads(user: string) {
    return `@pmate/user_threads:${user}`
  }

  static userLogs(user: string) {
    return `@pmate/user_logs:${user}`
  }

  static legacyUserLogs(user: string) {
    return TopicNames.userLogs(user)
  }

  static userContacts(profileId: string) {
    return `@pmate/user_contacts:${profileId}`
  }

  static usersMessage(userId: string) {
    return `@pmate/user_messages:${userId}`
  }

  static userMapping() {
    return "@pmate/username_mapping"
  }

  static userMobileMapping() {
    return "@pmate/mobile_account"
  }

  static mapping() {
    return "@pmate/mapping"
  }

  static profiles() {
    return "@pmate/profiles"
  }

  static groups() {
    return "@pmate/groups"
  }

  static relationships() {
    return "@pmate/relationships"
  }
}

type TopicKindMatcher = {
  kind: TS_LogKind
  match: (topic: string) => boolean
}

const topicKindMatchers: TopicKindMatcher[] = [
  {
    kind: TS_LogKind.UserLogs,
    match: (topic) => topic.startsWith("@pmate/user_logs:"),
  },
  {
    kind: TS_LogKind.UserMessages,
    match: (topic) => topic.startsWith("@pmate/user_messages:"),
  },
  {
    kind: TS_LogKind.Relationships,
    match: (topic) => topic === TopicNames.relationships(),
  },
  {
    kind: TS_LogKind.Rooms,
    match: (topic) => topic === TopicNames.rooms(),
  },
  {
    kind: TS_LogKind.UserContacts,
    match: (topic) => topic.startsWith("@pmate/user_contacts:"),
  },
  {
    kind: TS_LogKind.Entity_GROUP,
    match: (topic) => topic === TopicNames.groups(),
  },
  {
    kind: TS_LogKind.UserMapping,
    match: (topic) => topic === TopicNames.userMapping(),
  },
  {
    kind: TS_LogKind.UserMobileMapping,
    match: (topic) => topic === TopicNames.userMobileMapping(),
  },
  {
    kind: TS_LogKind.Mapping,
    match: (topic) => topic === TopicNames.mapping(),
  },
  {
    kind: TS_LogKind.UserThreads,
    match: (topic) => topic.startsWith("@pmate/user_threads:"),
  },
]

export function resolveTopicKind(topic: string): TS_LogKind {
  const matcher = topicKindMatchers.find(({ match }) => match(topic))
  return matcher ? matcher.kind : TS_LogKind.Unknown
}
