import {
  Msg,
  MsgBodyMap,
  MsgKind,
  MsgOp,
  SYSTEM_NOTIFY_CODE,
  USER_MESSAGE_OPS,
} from "@pmate/meta"
import { HashType, uniqHash } from "@pmate/utils"

const calcThreadHash = (raw: string) => {
  return uniqHash(`thread:${raw}`, HashType.THREAD)
}

export class ThreadUtils {
  static dmHash(from: string, to: string): string {
    return `dm@${calcThreadHash([from, to].sort().join("-"))}`
  }

  static groupHash(groupId: string): string {
    return `group@${groupId}`
  }

  static resolveEntityId(threadHash: string, fallback: string): string {
    if (threadHash.startsWith("group@")) {
      return threadHash.slice("group@".length)
    }
    return fallback
  }

  static threadHashFromMsg(msg: Msg<any>) {
    if (msg.kind === MsgKind.DM) {
      return ThreadUtils.dmHash(msg.from, msg.to)
    }
    if (msg.kind === MsgKind.GROUP) {
      return ThreadUtils.groupHash(msg.to)
    }

    throw new Error(`Unknown MsgKind: ${msg.kind}`)
  }

  static aggregateThreadLogs(logs: Msg<any>[]): Msg<any>[] {
    const ordered: Array<Msg<any> | null> = []
    const hashIndex = new Map<string, number>()
    let pruneIndex = 0

    const pruneUntil = (timestamp: number) => {
      while (pruneIndex < ordered.length) {
        const msg = ordered[pruneIndex]
        if (!msg) {
          pruneIndex++
          continue
        }
        if (msg.t > timestamp) {
          break
        }
        hashIndex.delete(msg.hash)
        ordered[pruneIndex] = null
        pruneIndex++
      }
    }

    const removeByHash = (hash?: string) => {
      if (!hash) {
        return
      }
      const index = hashIndex.get(hash)
      if (index === undefined) {
        return
      }
      hashIndex.delete(hash)
      ordered[index] = null
      if (index === pruneIndex) {
        while (pruneIndex < ordered.length && !ordered[pruneIndex]) {
          pruneIndex++
        }
      }
    }

    for (const log of logs) {
      if (log.opcode === MsgOp.DELETE_CHAT) {
        pruneUntil(log.t)
        continue
      }

      if (log.opcode === MsgOp.RECALL) {
        const targetHash = (log.body as MsgBodyMap[MsgOp.RECALL] | undefined)
          ?.hash
        removeByHash(targetHash)
        continue
      }

      if (log.opcode === MsgOp.SYSTEM_NOTIFY) {
        const body = log.body as MsgBodyMap[MsgOp.SYSTEM_NOTIFY] | undefined
        const shouldRemove =
          body &&
          (body.code === SYSTEM_NOTIFY_CODE.DM_ACL_REJECT ||
            body.code === SYSTEM_NOTIFY_CODE.GROUP_ACL_REJECT)
        if (shouldRemove && body?.msg_hash) {
          removeByHash(body.msg_hash)
        }
        continue
      }

      if (USER_MESSAGE_OPS.has(log.opcode)) {
        if (hashIndex.has(log.hash)) {
          continue
        }
        ordered.push(log)
        hashIndex.set(log.hash, ordered.length - 1)
      }
    }

    return ordered.filter((msg): msg is Msg<any> => Boolean(msg))
  }

  static paginateMessages(
    messages: Msg<any>[],
    pageSize: number
  ): { messages: Msg<any>[] }[] {
    const pages: { messages: Msg<any>[] }[] = []
    for (let end = messages.length; end > 0; ) {
      const start = Math.max(0, end - pageSize)
      pages.push({
        messages: messages.slice(start, end),
      })
      end = start
    }
    return pages
  }
}
