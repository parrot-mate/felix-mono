import * as crypto from "crypto"
const secret = "F3D2C1K4-4$$3C-4A!B-8B1A-1FVMWOlW"
export const sign = (message: string) => {
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(message)
  return hmac.digest("hex")
}
