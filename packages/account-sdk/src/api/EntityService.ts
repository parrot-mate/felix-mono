import { GroupInfo, Profile } from "@pmate/meta"
import { Api } from "./Api"

const endpoint = "https://api-global-qa.skedo.cn/account"

export class EntityService {
  public static async entity<T>(id: string): Promise<T | null> {
    return (await Api.get<T>(`${endpoint}/entity/${id}`)) || null
  }

  public static getProfile(id: string): Promise<Profile | null> {
    return EntityService.entity<Profile>(id)
  }

  public static getGroup(id: string): Promise<GroupInfo | null> {
    return EntityService.entity<GroupInfo>(id)
  }

  public static async entities<T extends { id?: string }>(
    ids: string[]
  ): Promise<Record<string, T>> {
    if (!ids.length) {
      return {}
    }
    const url = `${endpoint}/entities`
    const list =
      (await Api.post<T[]>(url, {
        ids,
      })) || []
    return list.reduce<Record<string, T>>((acc, entity, index) => {
      if (!entity) {
        return acc
      }
      const key = entity.id ?? ids[index]
      if (key) {
        acc[key] = entity
      }
      return acc
    }, {})
  }
}
