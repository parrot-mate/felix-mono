import { describe, expect, it, vi } from "vitest"
import { HttpContext } from "./HttpContext"
import { getUploadRoute } from "./upload.configs"
import { parseUploadRequest } from "./uploadRequest"
import { handleJsonUpload } from "./uploadHandlers"
import { uploadFileToOSS } from "./alioss"

vi.mock("./alioss", () => {
  return {
    uploadFileToOSS: vi
      .fn()
      .mockResolvedValue("https://book.skedo.cn/users/mock-user/books/mock.txt"),
    uploadJsonToOSS: vi
      .fn()
      .mockResolvedValue(
        "https://book.skedo.cn/users/mock-user/books/mock.json"
      ),
    getPublicObjectUrl: vi
      .fn()
      .mockImplementation((key: string) => `https://book.skedo.cn/${key}`),
  }
})

const SERVICE_ENDPOINT =
  process.env.UPLOADER_E2E_URL ?? "https://fc-uploader.skedo.cn"

describe("handleUploadFile e2e", () => {
  it(
    "uploads file through the live fc-uploader service",
    async () => {
      const payload = {
        user: `codex-e2e-${Date.now()}`,
        base64: Buffer.from(
          `Vitest fc-uploader e2e ${new Date().toISOString()}`
        ).toString("base64"),
        filename: "vitest.txt",
      }

      const fullUrl = `${SERVICE_ENDPOINT}/file`
      console.log("handleUploadFile e2e request:", fullUrl)
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(typeof json.data).toBe("string")
      expect(json.data.startsWith("https://book.skedo.cn/users/")).toBe(true)
    },
    30000
  )
})

describe("upload router", () => {
  it("parses binary payloads without relying on base64 data", async () => {
    const user = "codex-binary"
    const payloadBuffer = Buffer.from(
      `binary body ${new Date().toISOString()}`,
      "utf8"
    )
    const mockEvent = JSON.stringify({
      rawPath: "/file",
      headers: {
        "content-type": "text/plain",
        "x-uploader-user": user,
      },
      body: payloadBuffer.toString("base64"),
      isBase64Encoded: true,
      queryStringParameters: {},
      requestContext: {
        http: {
          method: "POST",
        },
      },
    })
    const context = new HttpContext(mockEvent, () => {})
    const route = getUploadRoute("/file")
    if (!route) {
      throw new Error("Missing /file route configuration")
    }
    const uploadPayload = parseUploadRequest(route, context)

    expect(uploadPayload.user).toBe(user)
    expect(uploadPayload.extension).toBe("txt")
    expect(uploadPayload.contentType).toBe("text/plain")
    expect(uploadPayload.data.equals(payloadBuffer)).toBe(true)

    const result = await handleJsonUpload(route, uploadPayload)
    expect(result).toBe(
      "https://book.skedo.cn/users/mock-user/books/mock.txt"
    )
    expect(uploadFileToOSS).toHaveBeenCalledTimes(1)
    expect(uploadFileToOSS).toHaveBeenCalledWith(
      expect.stringContaining(`users/${user}/books/${uploadPayload.hash}.txt`),
      payloadBuffer,
      "text/plain"
    )
  })
})
