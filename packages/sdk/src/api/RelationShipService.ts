import { AclStatus } from "@pmate/meta"
import { Api } from "./Api"

export class RelationShipService {
  public static async aclStatus(
    userId1: string,
    userId2: string
  ): Promise<AclStatus> {
    const endpoint = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!
    const status = await Api.get<AclStatus>(
      `${endpoint}/acl/status?from=${userId1}&to=${userId2}`
    )
    return status || AclStatus.AllowFirstMsg
  }

  public static async findFriend(userName: string): Promise<string> {
    const endpoint = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!
    const profileEndpoint =
      process.env.VITE_PUBLIC_PROFILE_SERVICE ??
      process.env.VITE_PUBLIC_AUTH_SERVER_ENDPOINT ??
      endpoint
    const url = `${profileEndpoint}/find?userName=${encodeURIComponent(
      userName
    )}`
    return (await Api.get<string>(url)) || ""
  }
}
