import { BizErrorCode, VCodeFor } from "@pmate/meta"
import {
  AuthRequest,
  Captcha,
  KVStore,
  NonceManager,
  ServiceError,
  VCodeIssueRequest,
  VCodeRecord,
} from "@pmate/service-core"

export const TEST_VCODE = "888888"
const TEST_MOBILE_PREFIX = "test_"

type TestVCodeRecord = VCodeRecord & {
  testFlow: true
}

let testVCodeStorePromise:
  | Promise<Awaited<ReturnType<typeof KVStore.create<TestVCodeRecord>>>>
  | null = null

export function isTestHeaderAuthorized(request: Request) {
  const testKey = process.env.TEST_AUTH_KEY?.trim()
  if (!testKey) return false
  return firstHeaderValue(request.headers.get("x-test")) === testKey
}

export function isAllowedTestMobile(mobile: string) {
  return normalizeMobile(mobile).startsWith(TEST_MOBILE_PREFIX)
}

export function assertAllowedTestMobile(mobile: string) {
  if (!isAllowedTestMobile(mobile)) {
    throw new ServiceError("Invalid test mobile", 401, BizErrorCode.AUTH_ERROR)
  }
}

export async function issueTestSmsCode(
  payload: VCodeIssueRequest,
  options?: { ipAddress?: string }
) {
  const mobile = normalizeMobile(payload.mobile)
  console.log("[testAuth:issue:start]", mobile, payload.purpose ?? "")
  assertAllowedTestMobile(mobile)

  console.log("[testAuth:issue:nonce:start]", mobile)
  const { nonce, issuedAt } = await NonceManager.create({
    ipAddress: options?.ipAddress,
  })
  console.log("[testAuth:issue:nonce:ok]", mobile, nonce, issuedAt)
  const expiresAt = new Date(
    Date.now() + Captcha.VCODE_TTL_SECONDS * 1000
  ).toISOString()
  const record: TestVCodeRecord = {
    nonce,
    channel: "sms",
    mobile,
    code: TEST_VCODE,
    issuedAt,
    expiresAt,
    purpose: normalizePurpose(payload.purpose),
    ipAddress: options?.ipAddress,
    testFlow: true,
  }

  console.log("[testAuth:issue:store:start]", mobile, nonce)
  const store = await getTestVCodeStore()
  await store.set(nonce, record, Captcha.VCODE_TTL_SECONDS)
  console.log("[testAuth:issue:store:ok]", mobile, nonce, expiresAt)
  return {
    result: { nonce, issuedAt, expiresAt },
    vcode: TEST_VCODE,
    mobile,
  }
}

export async function verifyTestAuthRequest(request: AuthRequest) {
  if (!request?.body) {
    throw new ServiceError(
      "Missing auth payload",
      401,
      BizErrorCode.AUTH_ERROR
    )
  }
  if (request.body.type !== "sms") {
    throw new ServiceError(
      "Unsupported auth method",
      401,
      BizErrorCode.AUTH_ERROR
    )
  }

  const mobile = normalizeMobile(request.body.mobile)
  assertAllowedTestMobile(mobile)

  const nonce = request.nonce?.trim()
  if (!nonce) {
    throw new ServiceError("Missing nonce", 401, BizErrorCode.AUTH_ERROR)
  }

  const store = await getTestVCodeStore()
  const record = await store.get(nonce)
  if (!record?.testFlow) {
    throw new ServiceError(
      "Invalid or expired verification code",
      401,
      BizErrorCode.AUTH_ERROR
    )
  }

  if (record.mobile !== mobile) {
    throw new ServiceError(
      "Invalid verification target",
      401,
      BizErrorCode.AUTH_ERROR
    )
  }

  if (normalizeCode(request.body.vcode) !== TEST_VCODE) {
    throw new ServiceError(
      "Incorrect verification code",
      401,
      BizErrorCode.AUTH_ERROR
    )
  }

  const requestIssuedMs = Date.parse(request.issuedAt)
  const recordIssuedMs = Date.parse(record.issuedAt)
  if (
    Number.isNaN(requestIssuedMs) ||
    Number.isNaN(recordIssuedMs) ||
    requestIssuedMs !== recordIssuedMs
  ) {
    throw new ServiceError(
      "Invalid nonce metadata",
      401,
      BizErrorCode.AUTH_ERROR
    )
  }

  const expiresMs = Date.parse(record.expiresAt)
  if (Number.isNaN(expiresMs) || Date.now() > expiresMs) {
    throw new ServiceError(
      "Verification code expired",
      401,
      BizErrorCode.AUTH_ERROR
    )
  }

  await NonceManager.consume(nonce)
  await store.delete(nonce)

  return {
    type: "sms" as const,
    mobile: record.mobile,
    purpose: record.purpose,
  }
}

function normalizeMobile(value: string) {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, "")
}

function normalizeCode(value: string) {
  if (typeof value !== "string") return ""
  return value.trim()
}

function normalizePurpose(purpose: VCodeFor | undefined) {
  if (purpose === "register" || purpose === "login") {
    return purpose
  }
  return "login"
}

function firstHeaderValue(value: string | null): string | null {
  return value ?? null
}

function getTestVCodeStore() {
  if (!testVCodeStorePromise) {
    console.log("[testAuth:getStore:init]")
    testVCodeStorePromise = KVStore.create<TestVCodeRecord>({
      prefix: "auth-test-vcode",
    })
  }
  return testVCodeStorePromise
}
