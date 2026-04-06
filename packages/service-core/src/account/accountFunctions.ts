import * as crypto from "crypto"
import { keccak256 } from "js-sha3"
import { sha1 } from "../util/sha1Hash"
const secret = "F3D2C1K4-4$$3C-4A!B-8B1A-1FVMWOlW"
const sign = (message: string) => {
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(message)
  return hmac.digest("hex")
}

function verifyHash(message: string, hash: string): boolean {
  const newHash = sign(message)
  return newHash === hash
}

function _generateUniqueId(): string {
  const timestamp = Date.now().toString(36) // Convert current timestamp to base-36 string
  const randomString = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    }
  )
  return `${timestamp}-${randomString}`
}

export function generateVCode(digit: number): string {
  const random = Math.random()
    .toString()
    .slice(2, 2 + digit)
  return random
}

export function genUniqUserId() {
  return sha1(_generateUniqueId())
}

export function genSubAccountName() {
  const rand = Math.random().toString(36).slice(2, 14)
  return `pmid-${rand}`
}

export function genSubAccountId(mainId: string, name: string) {
  return keccak256(`${mainId}-${name}`)
}

export function signToken(user: string): [string, number] {
  const signTime = Date.now()
  const str = `${signTime}-${user}`
  return [sign(str), signTime]
}

export function verifyToken(user: string, signTime: number, token: string) {
  const message = `${signTime}-${user}`
  return verifyHash(message, token)
}
