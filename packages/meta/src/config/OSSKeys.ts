import { ACCOUNT_VER } from "./consts"

export class OSSKeys {
  static address(id: string) {
    return `addresses/${id}.json`
  }

  static info(id: string) {
    return `users/${ACCOUNT_VER}/${id}/info.json`
  }

  static avatar(id: string, hash: string) {
    return `users/${ACCOUNT_VER}/${id}/${hash}.jpg`
  }

  static blockMeta(id: string) {
    return `users/${ACCOUNT_VER}/${id}/block.meta`
  }

  static block(id: string, index: number) {
    return `users/${ACCOUNT_VER}/${id}/blocks/${index}.block`
  }

  static log(id: string, file: string) {
    return `users/${ACCOUNT_VER}/${id}/${file}.log`
  }

  static volcabulary(id: string) {
    return `users/${ACCOUNT_VER}/${id}/volcabulary.log`
  }

  static file(user: string, key: string) {
    return `user-files/${ACCOUNT_VER}/${user}/${key}.json`
  }

  static roomInfo(roomId: string) {
    return `rooms/${ACCOUNT_VER}/${roomId}/info.json`
  }

  static tsdbMeta(topic: string) {
    const metaKey = `tsdb/${topic}/meta.log`
    return metaKey
  }
}
