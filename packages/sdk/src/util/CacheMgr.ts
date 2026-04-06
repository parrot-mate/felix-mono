import { Cached, RoomPeerInfo } from "@pmate/meta"
import { MsgDB } from "./MsgDB"

export class CacheMgr<T> {
  constructor(private db: MsgDB<Cached<T>>, private expireTime: number) {}

  public async get(id: string): Promise<T | null> {
    const item = await this.db.get(id)
    if (item.isNothing()) {
      return null
    }
    const cached = item.unwrap()
    if (cached.expire < Date.now()) {
      await this.db.delete(id)
      return null
    }
    return cached.data
  }

  public async set(id: string, data: T): Promise<void> {
    const expire = !this.expireTime
      ? Number.MAX_SAFE_INTEGER
      : Date.now() + this.expireTime
    await this.db.save(id, { data, expire })
  }

  public static peers: CacheMgr<RoomPeerInfo> = new CacheMgr(MsgDB.Peers, 0)
}
