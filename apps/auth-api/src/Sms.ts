import Credential, { Config } from "@alicloud/credentials"
import Dysmsapi20170525, * as $Dysmsapi20170525 from "@alicloud/dysmsapi20170525"
import * as $OpenApi from "@alicloud/openapi-client"
import * as $Util from "@alicloud/tea-util"
import { BizErrorCode } from "@pmate/meta"
import { ServiceError } from "@pmate/service-core"

export class Sms {
  static async sendVcode(mobile: string, vcode: string) {
    const client = Sms.createClient()
    const { signName, templateCode, templateParamKey } = Sms.getTemplateConfig()
    const request = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: mobile,
      signName,
      templateCode,
      templateParam: JSON.stringify({ [templateParamKey]: vcode }),
    })
    try {
      await client.sendSmsWithOptions(request, new $Util.RuntimeOptions({}))
    } catch (error: unknown) {
      const ex = error as { message?: string }
      throw new ServiceError(
        ex.message ?? "Failed to send SMS",
        500,
        BizErrorCode.AUTH_ERROR
      )
    }
  }

  private static createClient() {
    const credentialConfig = new Config({
      type: "access_key",
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || "",
      accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || "",
    })
    const credential = new Credential(credentialConfig)
    const config = new $OpenApi.Config({
      credential,
    })
    config.endpoint = "dysmsapi.aliyuncs.com"
    return new Dysmsapi20170525(config)
  }

  private static getTemplateConfig() {
    const signName = "鼠象科技"
    const templateCode = "SMS_500765111"
    if (!signName || !templateCode) {
      throw new ServiceError(
        "SMS template config is missing",
        500,
        BizErrorCode.AUTH_ERROR
      )
    }
    const templateParamKey = "code"
    return { signName, templateCode, templateParamKey }
  }
}
