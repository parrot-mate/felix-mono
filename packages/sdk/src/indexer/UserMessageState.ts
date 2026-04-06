import {
  Msg,
  MsgBodyMap,
  MsgOp,
  SYSTEM_NOTIFY_CODE,
  ThreadInfo,
  USER_MESSAGE_OPS,
} from "@pmate/meta"
import { ThreadUtils } from "@sdk/util/ThreadUtils"

export type ThreadStore = Record<string, ThreadInfo>

export type LogFunction = (
  message: string,
  context?: Record<string, unknown>
) => void

export class UserMessageState {
  private threads: ThreadStore = {}
  private threadHashSets: Record<string, Set<string>> = {}

  public constructor(private readonly logger?: LogFunction) {}

  public aggregate(log: Msg<any>) {
    const threadHash = this.safeThreadHash(log)
    if (!threadHash) {
      return
    }

    const info = this.ensureThreadInfo(threadHash)
    const hashSet = this.ensureHashSet(threadHash)

    if (log.opcode === MsgOp.DELETE_CHAT) {
      info.msgs = info.msgs.filter((m) => m.t > log.t)
      this.threadHashSets[threadHash] = new Set(info.msgs.map((m) => m.hash))
      return
    }

    if (log.opcode === MsgOp.RECALL) {
      const target = (log.body as any)?.hash
      if (target) {
        hashSet.delete(target)
        info.msgs = info.msgs.filter((m) => m.hash !== target)
      }
      return
    }

    if (log.opcode === MsgOp.SYSTEM_NOTIFY) {
      const body = log.body as MsgBodyMap[MsgOp.SYSTEM_NOTIFY]
      const shouldRemove =
        body.code === SYSTEM_NOTIFY_CODE.DM_ACL_REJECT ||
        body.code === SYSTEM_NOTIFY_CODE.GROUP_ACL_REJECT
      if (shouldRemove && body.msg_hash) {
        hashSet.delete(body.msg_hash)
        info.msgs = info.msgs.filter((m) => m.hash !== body.msg_hash)
      }
      return
    }

    if (USER_MESSAGE_OPS.has(log.opcode)) {
      if (hashSet.has(log.hash)) {
        return
      }
      hashSet.add(log.hash)
      info.msgs.push(log)
      info.msgs.sort((a, b) => a.t - b.t)
    }
  }

  public rebuild(logs: Msg<any>[]) {
    this.threads = {}
    this.threadHashSets = {}
    for (const log of logs) {
      this.aggregate(log)
    }
  }

  public getThread(threadHash: string): ThreadInfo | undefined {
    return this.threads[threadHash]
  }

  public getAll(): ThreadStore {
    return this.threads
  }

  private ensureThreadInfo(threadHash: string): ThreadInfo {
    if (!this.threads[threadHash]) {
      this.threads[threadHash] = {
        threadId: threadHash,
        type: threadHash.startsWith("dm@") ? "dm" : "group",
        name: "",
        avatar: "",
        unreadNum: 0,
        msgs: [],
      }
    }
    this.ensureHashSet(threadHash)
    return this.threads[threadHash]!
  }

  private ensureHashSet(threadHash: string): Set<string> {
    if (!this.threadHashSets[threadHash]) {
      this.threadHashSets[threadHash] = new Set<string>()
    }
    return this.threadHashSets[threadHash]!
  }

  private safeThreadHash(msg: Msg<any>): string | null {
    try {
      return ThreadUtils.threadHashFromMsg(msg)
    } catch (error) {
      this.logger?.("Failed to derive thread hash from message", {
        opcode: msg.opcode,
        kind: msg.kind,
        error,
      })
      return null
    }
  }
}
