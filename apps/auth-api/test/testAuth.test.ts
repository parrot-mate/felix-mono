import { describe, expect, it } from "vitest"
import { AuthRequest, ServiceError } from "@pmate/service-core"
import "../src/env"
import {
  TEST_VCODE,
  isAllowedTestMobile,
  isTestHeaderAuthorized,
  issueTestSmsCode,
  verifyTestAuthRequest,
} from "../src/testAuth"

process.env.REDIS_URL = ""

describe("test auth flow", () => {
  it("authorizes only matching x-test headers", () => {
    process.env.TEST_AUTH_KEY = "test-key"
    expect(
      isTestHeaderAuthorized(
        new Request("https://auth.pmate.chat/login", {
          headers: { "x-test": "test-key" },
        })
      )
    ).toBe(true)
    expect(
      isTestHeaderAuthorized(
        new Request("https://auth.pmate.chat/login", {
          headers: { "x-test": "wrong" },
        })
      )
    ).toBe(false)
  })

  it("allows only test_ mobiles", () => {
    expect(isAllowedTestMobile("test_123")).toBe(true)
    expect(isAllowedTestMobile("13800000000")).toBe(false)
  })

  it("issues and verifies a test nonce with fixed vcode", async () => {
    const mobile = `test_${Date.now()}`
    const { result } = await issueTestSmsCode({
      mobile,
      purpose: "login",
    })

    const verification = await verifyTestAuthRequest({
      body: {
        type: "sms",
        mobile,
        vcode: TEST_VCODE,
      },
      nonce: result.nonce,
      issuedAt: result.issuedAt,
      app: "auth-api-test",
    })

    expect(verification.mobile).toBe(mobile)
    expect(verification.purpose).toBe("login")
  })

  it("rejects incorrect fixed test vcode", async () => {
    const mobile = `test_${Date.now()}`
    const { result } = await issueTestSmsCode({
      mobile,
      purpose: "login",
    })

    await expect(
      verifyTestAuthRequest({
        body: {
          type: "sms",
          mobile,
          vcode: "000000",
        },
        nonce: result.nonce,
        issuedAt: result.issuedAt,
      } as AuthRequest)
    ).rejects.toMatchObject<ServiceError>({
      httpCode: 401,
      message: "Incorrect verification code",
    })
  })

  it("rejects nonce reuse across different test mobiles", async () => {
    const sourceMobile = `test_${Date.now()}`
    const { result } = await issueTestSmsCode({
      mobile: sourceMobile,
      purpose: "login",
    })

    await expect(
      verifyTestAuthRequest({
        body: {
          type: "sms",
          mobile: `test_other_${Date.now()}`,
          vcode: TEST_VCODE,
        },
        nonce: result.nonce,
        issuedAt: result.issuedAt,
      } as AuthRequest)
    ).rejects.toMatchObject<ServiceError>({
      httpCode: 401,
      message: "Invalid verification target",
    })
  })
})
