import { VCodeFor, VCodeVerifyRequest } from "@pmate/meta"
import { verifyHash } from "../../util/sign/verifySign"

export const verifyVCode = (req: VCodeVerifyRequest) => {
  const { applyTime, mobile, vcodeFor, vcode, token } = req
  // if (vcodeFor !== _vcodeFor || mobile !== _mobile) {
  //   throw new Error("验证码错误")
  // }
  const message = `${applyTime}-${mobile}-${vcodeFor}-${vcode}`
  if (Date.now() - applyTime > 60000) {
    throw new Error("验证码错误")
  }

  if (!verifyHash(message, token)) {
    throw new Error("验证码错误")
  }
  return true
}
