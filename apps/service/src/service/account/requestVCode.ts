import { VCodeFor } from "@pmate/meta"
import { sign } from "../../util/sign/sign"
import { generateVCode } from "@pmate/service-core"

export const requestVCode = (mobile: string, registerFor: VCodeFor) => {
  const applyTime = Date.now()
  const vcode = generateVCode(6)
  const message = `${applyTime}-${mobile}-${registerFor}-${vcode}`
  const token = sign(message)
  return { token, vcode, applyTime }
}
