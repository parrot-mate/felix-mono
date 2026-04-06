import type { Profile } from "./blockchain.types"
import type { Msg } from "./message.types"

export type RoomType = "dm" | "group"

export interface Room {
  threadHash: string // work as ID
  owner?: string // owner id if has
  type: RoomType // dm: Direct message from 2 users; group: a channel for multiple users;
  info: {
    title?: string // a title ( replace groupName )
    avatar?: string // Room's avatar
  }
  peers: string[] // all members id.
}

export type RoomBasic = Pick<Room, "owner" | "threadHash">

export type UserThreadRecord =
  | { user: string; type: "group"; groupId: string }
  | { user: string; type: "chat"; profileId: string }

export interface Contact {
  ownerId: string
  /** groupId or profileId */
  id: string
  type: RoomType
}

export interface GroupInfo {
  id: string
  ownerId: string
  title: string
  avatar: string
  members: string[]
}

export type DMContact = {
  type: "dm"
  profile: Profile
}

export type GroupContact = {
  type: "group"
  group: GroupInfo
}

export type ContactInfo = DMContact | GroupContact

export type ThreadInfo = {
  /** unique id used for room */
  threadId: string
  type: RoomType
  /** group name or profile nickname */
  name: string
  /** avatar url */
  avatar: string
  unreadNum: number
  msgs: Msg<any>[]
}

export type ThreadInfoV2 = {
  threadHash: string
  type: RoomType
  associatedId: string
  lastUpdateAt: number
  name: string // dm: profile nickname, group: group title
  avatar: string // dm: profile avatar, group: group avatar

  lastMessage: Msg<any>
  total: number
  unread: number
}

export type RoomPeerInfo = Omit<Profile, "gender"> & {
  gender: "" | "F" | "M"
  isOnline: boolean
}

export interface Log_Create<T> {
  type: "create"
  data: T
}

export interface Log_Delete {
  type: "delete"
  id: string
}

export interface Log_Update<T> {
  type: "update"
  data: Partial<T>
}

export type PM_Log<T> = Log_Create<T> | Log_Update<T> | Log_Delete

export interface RelationshipLog {
  type: "agree" | "reject" | "request" | "delete" | "block"
  data: {
    from: string
    to: string
  }
}

export type RelationshipStatus =
  | "init"
  | "requesting"
  | "rejected"
  | "agreed"
  | "blocked"

export enum AclStatus {
  AllowFirstMsg = 0,
  BlockNotAgree = 1,
  AllowAgree = 2,
  BlockBlacklist = 3,
}
