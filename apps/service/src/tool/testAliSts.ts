import "../env"
import { AliSts, STSRequest } from "../util/aliSts"

const durationSecondsArg = process.argv[2]
const sessionNameArg = process.argv[3]

async function run() {
  const body: STSRequest = {}

  if (durationSecondsArg) {
    const durationSeconds = Number.parseInt(durationSecondsArg, 10)
    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
      body.durationSeconds = durationSeconds
    }
  }

  if (sessionNameArg) {
    body.sessionName = sessionNameArg
  }

  const result = await AliSts.create(body)
  const credentials = result.credentials as
    | {
        AccessKeyId?: string
        Expiration?: string
        SecurityToken?: string
      }
    | undefined

  console.log({
    region: result.region,
    bucket: result.bucket,
    accessKeyId: credentials?.AccessKeyId,
    expiration: credentials?.Expiration,
    hasSecurityToken: Boolean(credentials?.SecurityToken),
  })
}

run().catch((error) => {
  console.error("AliSts test failed:", error)
  process.exit(1)
})
