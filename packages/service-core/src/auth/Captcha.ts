import {
  AuthRequest,
  AuthVerificationContext,
  VCodeIssueRequest,
  VCodeIssueResult,
  VCodeRecord,
} from "../types"
import { BizErrorCode, CaptchaVerifyRequest, CaptchaVerifyResult } from "@pmate/meta"
import captcha20230305, * as $captcha20230305 from "@alicloud/captcha20230305"
import * as $OpenApi from "@alicloud/openapi-client"
import * as $Util from "@alicloud/tea-util"
import Credential from "@alicloud/credentials"
import { NonceManager } from "./NonceManager"
import { KVStore } from "./KVStore"
import { unauthorized } from "./errors"
import { ServiceError } from "../ServiceError"

export class Captcha {
  static readonly VCODE_TTL_SECONDS = 5 * 60
  static readonly VCODE_LENGTH = 6

  private static storePromise:
    | Promise<Awaited<ReturnType<typeof KVStore.vcodeStore>>>
    | null = null

  static async issueSmsCode(
    payload: VCodeIssueRequest,
    options?: { ipAddress?: string }
  ): Promise<VCodeIssueResult> {
    const { result } = await Captcha.issueSmsCodeWithVcode(payload, options)
    return result
  }

  static async issueSmsCodeWithVcode(
    payload: VCodeIssueRequest,
    options?: { ipAddress?: string }
  ): Promise<{
    result: VCodeIssueResult
    vcode: string
    mobile: string
  }> {
    const mobile = Captcha.normalizeMobile(payload.mobile)
    if (!mobile) {
      throw unauthorized("Mobile is required")
    }

    const { nonce, issuedAt } = await NonceManager.create({
      ipAddress: options?.ipAddress,
    })
    const vcode = Captcha.generateCode()
    const expiresAt = new Date(
      Date.now() + Captcha.VCODE_TTL_SECONDS * 1000
    ).toISOString()
    const record: VCodeRecord = {
      nonce,
      channel: "sms",
      mobile,
      code: vcode,
      issuedAt,
      expiresAt,
      purpose: payload.purpose,
      ipAddress: options?.ipAddress,
    }

    const store = await Captcha.getStore()
    await store.set(nonce, record, Captcha.VCODE_TTL_SECONDS)
    return {
      result: { nonce, issuedAt, expiresAt },
      vcode,
      mobile,
    }
  }

  static async verify(request: AuthRequest): Promise<AuthVerificationContext> {
    if (!request?.body) {
      throw unauthorized("Missing auth payload")
    }
    if (request.body.type !== "sms") {
      throw unauthorized("Unsupported auth method")
    }

    const nonce = request.nonce?.trim()
    if (!nonce) {
      throw unauthorized("Missing nonce")
    }

    const store = await Captcha.getStore()
    const record = await store.get(nonce)
    if (!record) {
      throw unauthorized("Invalid or expired verification code")
    }

    const normalizedMobile = Captcha.normalizeMobile(request.body.mobile)
    if (!normalizedMobile || record.mobile !== normalizedMobile) {
      throw unauthorized("Invalid verification target")
    }

    if (record.code !== Captcha.normalizeCode(request.body.vcode)) {
      throw unauthorized("Incorrect verification code")
    }

    const requestIssuedMs = Date.parse(request.issuedAt)
    const recordIssuedMs = Date.parse(record.issuedAt)
    if (
      Number.isNaN(requestIssuedMs) ||
      Number.isNaN(recordIssuedMs) ||
      requestIssuedMs !== recordIssuedMs
    ) {
      throw unauthorized("Invalid nonce metadata")
    }

    const expiresMs = Date.parse(record.expiresAt)
    if (Number.isNaN(expiresMs) || Date.now() > expiresMs) {
      throw unauthorized("Verification code expired")
    }

    await NonceManager.consume(nonce)
    await store.delete(nonce)

    return {
      type: "sms",
      mobile: record.mobile,
      purpose: record.purpose,
    }
  }

  static async verifyCaptcha(
    payload: CaptchaVerifyRequest
  ): Promise<CaptchaVerifyResult> {
    if (!payload?.token) {
      return { valid: false }
    }

    const client = Captcha.createCaptchaClient()
    if (payload.scene) {
      const response = await client.verifyIntelligentCaptchaWithOptions(
        new $captcha20230305.VerifyIntelligentCaptchaRequest({
          captchaVerifyParam: payload.token,
          sceneId: payload.scene,
        }),
        new $Util.RuntimeOptions({})
      )
      return {
        valid: Boolean(
          response.body?.success && response.body?.result?.verifyResult
        ),
      }
    }

    const response = await client.verifyCaptchaWithOptions(
      new $captcha20230305.VerifyCaptchaRequest({
        captchaVerifyParam: payload.token,
      }),
      new $Util.RuntimeOptions({})
    )
    return {
      valid: Boolean(
        response.body?.success && response.body?.result?.verifyResult
      ),
    }
  }

  private static generateCode() {
    return Array.from({ length: Captcha.VCODE_LENGTH })
      .map(() => Math.floor(Math.random() * 10))
      .join("")
  }

  private static normalizeMobile(value: string) {
    if (typeof value !== "string") return ""
    return value.replace(/\s+/g, "")
  }

  private static normalizeCode(value: string) {
    if (typeof value !== "string") return ""
    return value.trim()
  }

  private static getStore() {
    if (!Captcha.storePromise) {
      Captcha.storePromise = KVStore.vcodeStore()
    }
    return Captcha.storePromise
  }

  private static createCaptchaClient() {
    try {
      const credential = new Credential()
      const config = new $OpenApi.Config({
        credential,
      })
      config.endpoint =
        process.env.ALIYUN_CAPTCHA_ENDPOINT ?? "captcha.cn-shanghai.aliyuncs.com"
      return new captcha20230305(config)
    } catch (error: unknown) {
      const ex = error as { message?: string }
      throw new ServiceError(
        ex.message ?? "Captcha credentials not configured",
        500,
        BizErrorCode.AUTH_ERROR
      )
    }
  }
}
