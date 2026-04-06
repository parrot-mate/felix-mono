import { calculateSHA1Hash } from "@pmate/utils"

export const hashTask = (path: string, body: any) => {
  const raw = path + "|" + JSON.stringify(body)
  return calculateSHA1Hash(raw)
}
