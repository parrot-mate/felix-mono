import {
  GroupInfo,
  OSSKeys,
  Profile,
  RelationshipStatus,
  Room,
} from "@pmate/meta"
import { Api } from "./Api"

const ACCOUNT_ENDPOINT = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!
const PROFILE_ENDPOINT = process.env.VITE_PUBLIC_PROFILE_SERVICE!
const CHAT_ENDPOINT = process.env.VITE_PUBLIC_CHAT_API_ENDPOINT!
const RESOURCE_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

export class SocialService {
  public static async createGroup(
    payload: Partial<Omit<GroupInfo, "id">>
  ): Promise<GroupInfo> {
    return Api.post<GroupInfo>(`${ACCOUNT_ENDPOINT}/group`, payload)
  }

  public static async findFriend(userName: string): Promise<string> {
    const url = `${PROFILE_ENDPOINT}/find?userName=${encodeURIComponent(
      userName
    )}`
    return (await Api.get<string>(url)) || ""
  }

  public static async getContacts(
    userId: string
  ): Promise<(Profile | GroupInfo)[]> {
    const url = `${ACCOUNT_ENDPOINT}/contacts?userId=${encodeURIComponent(
      userId
    )}`
    return (await Api.get<(Profile | GroupInfo)[]>(url)) || []
  }

  public static async getRelationship(
    fromId: string,
    toId: string
  ): Promise<RelationshipStatus> {
    const url = `${CHAT_ENDPOINT}/relationship?fromId=${encodeURIComponent(
      fromId
    )}&toId=${encodeURIComponent(toId)}`
    return (await Api.get<RelationshipStatus>(url)) || "init"
  }

  public static async getRoom(roomId: string): Promise<Room | null> {
    const url = `${RESOURCE_URL}/${OSSKeys.roomInfo(roomId)}?t=${Date.now()}`
    return (await Api.getFile<Room>(url)) ?? null
  }

  public static async getRoomsMap(
    ids: string[]
  ): Promise<Record<string, Room>> {
    const rooms = await Promise.all(ids.map((id) => SocialService.getRoom(id)))
    return rooms.reduce((acc, room) => {
      if (room) {
        acc[room.threadHash] = room
      }
      return acc
    }, {} as Record<string, Room>)
  }

  public static async removeContact(fromId: string, toId: string) {
    await Api.post(`${CHAT_ENDPOINT}/contact/remove`, { fromId, toId })
  }
}
