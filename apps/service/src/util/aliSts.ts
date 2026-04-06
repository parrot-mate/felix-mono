import OSS from "ali-oss"

export type STSRequest = {
  policy?: unknown
  durationSeconds?: number
  sessionName?: string
}

export class AliSts {
  static async create(body: STSRequest) {
    const accessKeyId = process.env.OSS_CI_ACCESS_KEY_ID
    const accessKeySecret = process.env.OSS_CI_ACCESS_KEY_SECRET
    const roleArn = process.env.ALI_STS_ROLE_ARN
    console.log("AliSts.create called with roleArn:", roleArn)

    if (!accessKeyId || !accessKeySecret || !roleArn) {
      throw new Error("OSS STS is not configured")
    }

    const durationSeconds =
      typeof body?.durationSeconds === "number" &&
      Number.isFinite(body.durationSeconds) &&
      body.durationSeconds > 0
        ? Math.floor(body.durationSeconds)
        : Number.parseInt(process.env.OSS_STS_DURATION_SECONDS ?? "", 10) ||
          3600

    const sessionName =
      body?.sessionName || process.env.OSS_STS_SESSION_NAME || "admin-session"

    const policy = body?.policy ?? process.env.OSS_STS_POLICY

    const sts = new OSS.STS({
      accessKeyId,
      accessKeySecret,
    })

    const result = await sts.assumeRole(
      roleArn,
      policy,
      durationSeconds,
      sessionName
    )

    return {
      credentials: result.credentials,
      region: process.env.OSS_REGION,
      bucket: process.env.OSS_BUCKET,
    }
  }
}
