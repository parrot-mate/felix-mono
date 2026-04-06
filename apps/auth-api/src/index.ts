import "./env"
import "./globalerror"
import "./blockchain"

import { cookie } from "@elysiajs/cookie"
import { cors } from "@elysiajs/cors"
import { node } from "@elysiajs/node"
import { BizErrorCode, CaptchaVerifyRequest, VCodeFor } from "@pmate/meta"
import {
  AuthRequest,
  Captcha,
  ServiceError,
  SessionManager,
  VCodeIssueRequest,
} from "@pmate/service-core"
import { Elysia } from "elysia"
import { Account } from "./Account"
import { Sms } from "./Sms"
import {
  createProfile,
  findProfileByUserName,
  getProfiles,
  updateProfile,
} from "./profile"
import {
  assertAllowedTestMobile,
  isTestHeaderAuthorized,
  issueTestSmsCode,
  verifyTestAuthRequest,
} from "./testAuth"

const app = new Elysia({
  adapter: node(),
})
  .use(cookie())
  .use(
    cors({
      origin: (request) => isAllowedOrigin(request.headers.get("origin")),
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: "content-type, authorization, x-test",
      credentials: true,
      maxAge: 86400,
    })
  )

app.onRequest(({ request }) => {
  console.log(
    "[REQ]",
    request.method,
    request.url,
    "auth?",
    !!request.headers.get("authorization")
  )
  const origin = request.headers.get("origin")
  if (!isAllowedOrigin(origin)) {
    return new Response("Not allowed by CORS", { status: 403 })
  }
})
app.onError(({ error, set, request }) => {
  console.log("Error occurred:", error)
  if (error instanceof ServiceError) {
    set.status = error.httpCode || 500
    return {
      success: false,
      message: error.message,
      code: error.bizCode,
    }
  }
  set.status = 500
  return {
    success: false,
    message: error instanceof Error ? error.message : String(error),
    path: new URL(request.url).pathname,
    stack: error instanceof Error ? error.stack : undefined,
  }
})

const captchaGuard = {
  beforeHandle: async ({
    body,
    request,
  }: {
    body?: unknown
    request: Request
  }) => {
    const testPayload = body as Partial<VCodeIssueRequest>
    if (isTestHeaderAuthorized(request)) {
      assertAllowedTestMobile(testPayload?.mobile ?? "")
      return
    }

    const payload = body as Partial<
      CaptchaVerifyRequest & {
        captchaToken?: string
        captchaScene?: string
      }
    >
    const token = payload?.captchaToken ?? payload?.token
    const scene = payload?.captchaScene ?? payload?.scene
    const result = await Captcha.verifyCaptcha({
      token: token ?? "",
      scene,
    })
    if (!result.valid) {
      throw new ServiceError("Invalid captcha", 401, BizErrorCode.AUTH_ERROR)
    }
  },
}

app.post(
  "/vcode",
  async ({ body, request }) => {
    const payload = body as Partial<VCodeIssueRequest>
    if (isTestHeaderAuthorized(request)) {
      const { result } = await issueTestSmsCode(
        {
          mobile: payload?.mobile ?? "",
          purpose: normalizePurpose(payload?.purpose),
        },
        { ipAddress: extractClientIp(request) }
      )
      return { success: true, data: result }
    }

    const { result, vcode, mobile } = await Captcha.issueSmsCodeWithVcode(
      {
        mobile: payload?.mobile ?? "",
        purpose: normalizePurpose(payload?.purpose),
      },
      { ipAddress: extractClientIp(request) }
    )
    await Sms.sendVcode(mobile, vcode)
    return { success: true, data: result }
  },
  captchaGuard
)

app.post("/captcha/verify", async ({ body }) => {
  const payload = body as Partial<CaptchaVerifyRequest>
  const result = await Captcha.verifyCaptcha(payload as CaptchaVerifyRequest)
  return { success: true, data: result }
})

app.post("/login", async ({ body, cookie, request }) => {
  const authRequest = body as AuthRequest
  const appId = authRequest.app
  let mobile = ""
  if (isTestHeaderAuthorized(request)) {
    const requestedMobile = getSmsMobile(authRequest.body) ?? ""
    assertAllowedTestMobile(requestedMobile)
    const verification = await verifyTestAuthRequest(authRequest)
    mobile = verification.mobile
  } else {
    const verification = await Captcha.verify(authRequest)
    mobile = verification.mobile
  }

  const exists = await Account.exists(mobile)
  const accountId = exists
    ? (await Account.info(mobile)).id
    : (await Account.createForMobile(mobile, appId)).account.id

  const { token, session } = await SessionManager.createSession({
    accountId,
  })
  cookie[SessionManager.SESSION_COOKIE_NAME].value = token
  cookie[SessionManager.SESSION_COOKIE_NAME].httpOnly = true
  cookie[SessionManager.SESSION_COOKIE_NAME].path = "/"
  cookie[SessionManager.SESSION_COOKIE_NAME].sameSite = "lax"
  cookie[SessionManager.SESSION_COOKIE_NAME].domain = "pmate.chat"
  return {
    success: true,
    data: {
      identity: session.identity,
      session,
      token,
    },
  }
})

app.post("/logout", async ({ request, cookie }) => {
  const token = extractSessionToken(request)
  if (token) {
    await SessionManager.invalidateSession(token)
  }

  cookie[SessionManager.SESSION_COOKIE_NAME].remove()
  return { success: true, data: { success: true } }
})

app.get("/session", async ({ request }) => {
  const { session } = await requireSession(request)
  return { success: true, data: session ?? null }
})

app.get("/profiles", async ({ query }) => {
  const { app, account } = query as {
    app?: string
    account?: string
  }
  if (!app || !account) {
    throw new Error("Missing app/account for profiles")
  }
  const profiles = await getProfiles({ app, account })
  return { success: true, data: profiles }
})

app.post("/profile", async ({ body }) => {
  const profile = await createProfile(body as any)
  return { success: true, data: profile }
})

app.put("/profile", async ({ body }) => {
  await updateProfile(body as any)
  return { success: true, data: true }
})

app.get("/find", async ({ query }) => {
  const userName = (query as { userName?: string }).userName ?? ""
  if (!userName) {
    return { success: true, data: "" }
  }
  const profileId = await findProfileByUserName(userName)
  return { success: true, data: profileId ?? "" }
})

app.get("/", () => "Auth Service is running.")

app.get("/test", async () => {
  throw new Error("This is a test error")
})

const PORT = process.env.AUTH_PORT || process.env.PORT || 5790
app.listen(PORT)
console.log(`Auth server running on port ${PORT}`)

function isAllowedOrigin(origin: string | null) {
  if (!origin) {
    return true
  }
  if (origin.includes("localhost")) {
    return true
  }

  if (origin.match(/(skedo\.cn|(pmate\.chat))/)) {
    return true
  }
  return false
}

function getSmsMobile(body: AuthRequest["body"]) {
  if (body?.type !== "sms") return null
  return body.mobile
}

function extractClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }
  return request.headers.get("cf-connecting-ip") || ""
}

function normalizePurpose(purpose: VCodeFor | undefined) {
  if (purpose === "register" || purpose === "login") {
    return purpose
  }
  return "login"
}

function extractSessionToken(request: Request) {
  const authHeader = firstHeaderValue(request.headers.get("authorization"))
  const cookieHeader = firstHeaderValue(request.headers.get("cookie"))
  return (
    SessionManager.readAuthorizationHeader(authHeader) ??
    SessionManager.readSessionCookie(cookieHeader)
  )
}

function firstHeaderValue(value: string | null): string | null {
  return value ?? null
}

async function requireSession(request: Request) {
  const token = extractSessionToken(request)
  return SessionManager.verifyL3Token(token)
}
