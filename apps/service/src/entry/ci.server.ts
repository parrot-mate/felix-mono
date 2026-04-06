require("../env")
import "../globalerror"

import cors from "cors"
import express, { json } from "express"
import { asyncHandler, errorHandler } from "../errorHandler"
import { AuthedRequest, requireSession } from "../util/auth/authMiddleware"
import { AliSts, STSRequest } from "../util/aliSts"

const app = express()

app.use(
  cors({
    preflightContinue: false,
    maxAge: 86400,
  })
)

app.post(
  "/oss/sts",
  json(),
  requireSession,
  ensureStsWhitelist,
  asyncHandler(async (body: STSRequest) => {
    return AliSts.create(body)
  })
)

app.get("/", (_req, res) => {
  res.json({ message: "ok" })
})

app.use(errorHandler)

const PORT = process.env.ADMIN_SERVICE_PORT || process.env.PORT || 9106
app.listen(PORT, () => {
  console.log(`Admin service listening on port ${PORT}`)
})

function ensureStsWhitelist(
  req: AuthedRequest,
  _res: express.Response,
  next: express.NextFunction
) {
  const accountId = req.session?.identity?.accountId
  if (!accountId) {
    next(new Error("Missing session"))
    return
  }

  const whitelist = getStsWhitelist()
  if (whitelist.length > 0 && !whitelist.includes(accountId)) {
    next(new Error("Not allowed for OSS STS"))
    return
  }

  next()
}

function getStsWhitelist(): string[] {
  const raw =
    process.env.OSS_STS_WHITELIST || process.env.ADMIN_OSS_STS_WHITELIST || ""
  if (!raw.trim()) {
    return []
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}
