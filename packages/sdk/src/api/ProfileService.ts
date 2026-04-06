import {
  AccountState,
  CreateProfileRequest,
  Profile,
  ProfileScope,
  ServerResponse,
  UpdateProfileRequest,
} from "@pmate/meta"
import { resolveAppId } from "@sdk/util/resolveAppId"
import { Api } from "./Api"

const ACCOUNT_ENDPOINT = process.env.VITE_PUBLIC_ACCOUNT_SERVICE!
const PROFILE_ENDPOINT =
  process.env.VITE_PUBLIC_PROFILE_SERVICE ??
  process.env.VITE_PUBLIC_AUTH_SERVER_ENDPOINT ??
  ACCOUNT_ENDPOINT
const UPLOADER_SERVICE_URL = (
  process.env.VITE_PUBLIC_UPLOADER_SERVICE_URL ??
  process.env.PUBLIC_UPLOADER_SERVICE_URL ??
  "https://fc-uploader.skedo.cn"
).replace(/\/+$/, "")

const EXTENSION_CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  bmp: "image/bmp",
  pdf: "application/pdf",
  mobi: "application/x-mobipocket-ebook",
  epub: "application/epub+zip",
  txt: "text/plain",
  json: "application/json",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  webm: "audio/webm",
  weba: "audio/webm",
  m4a: "audio/mp4",
}

type UploadRequest = {
  user: string
  base64: string
  filename?: string
  text?: string
  contentType?: string
}

export class ProfileService {
  public static async createProfile(
    req: CreateProfileRequest
  ): Promise<Profile> {
    return Api.post<Profile>(`${PROFILE_ENDPOINT}/profile`, req)
  }

  public static async updateProfile(req: UpdateProfileRequest) {
    await Api.put(`${PROFILE_ENDPOINT}/profile`, req)
  }

  public static async getProfiles(account: AccountState) {
    const scope: ProfileScope = {
      app: resolveAppId(account.app),
      account: account.accountId,
    }
    return ProfileService.getProfilesByScope(scope)
  }

  public static async getProfilesByScope(scope: ProfileScope) {
    const query = new URLSearchParams({
      app: scope.app,
      account: scope.account,
    }).toString()
    return (
      (await Api.get<Profile[]>(`${PROFILE_ENDPOINT}/profiles?${query}`)) || []
    )
  }

  public static async updateAvatar(req: {
    user: string
    base64: string
    filename: string
  }): Promise<string> {
    return ProfileService.uploadToUploaderService("/avatar", req)
  }

  public static async uploadMsgImage(req: {
    user: string
    base64: string
    filename: string
  }): Promise<string> {
    return ProfileService.uploadToUploaderService("/msg", req)
  }

  public static async updateMyVoice(req: {
    user: string
    base64: string
    text: string
  }): Promise<string> {
    return ProfileService.uploadToUploaderService("/my-voice", {
      ...req,
      filename: "voice.wav",
      contentType: "audio/wav",
    })
  }

  public static async uploadUserFile(req: {
    user: string
    base64: string
    filename: string
  }) {
    return ProfileService.uploadToUploaderService("/file", req)
  }

  private static async uploadToUploaderService(
    path: string,
    payload: UploadRequest
  ): Promise<string> {
    const { user, base64, filename, text } = payload
    const extension = ProfileService.getExtension(filename)
    const contentType =
      payload.contentType ||
      (extension ? EXTENSION_CONTENT_TYPE[extension] : null) ||
      "application/octet-stream"

    const headers: Record<string, string> = {
      "x-uploader-user": user,
      "Content-Type": contentType,
    }

    if (text) {
      headers["x-uploader-text"] = text
    }

    if (extension) {
      headers["x-uploader-ext"] = extension
    }

    const response = await fetch(`${UPLOADER_SERVICE_URL}${path}`, {
      method: "POST",
      headers,
      body: ProfileService.base64ToUint8Array(base64),
    })

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`)
    }

    const json = (await response.json()) as ServerResponse<string>
    if (!json.success) {
      throw new Error(json.message ?? "Upload failed")
    }

    return json.data
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    if (typeof atob === "function") {
      const binaryString = atob(base64)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes
    }

    const globalBuffer = (
      globalThis as typeof globalThis & {
        Buffer?: { from: (value: string, format: string) => Uint8Array }
      }
    ).Buffer

    if (globalBuffer) {
      const buffer = globalBuffer.from(base64, "base64")
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    }

    throw new Error("No base64 decoder available in current environment")
  }

  private static getExtension(filename?: string): string | null {
    if (!filename) {
      return null
    }
    const parts = filename.split(".")
    if (parts.length < 2) {
      return null
    }
    const ext = parts.pop() || ""
    return ext ? ext.replace(/^\./, "").toLowerCase() : null
  }
}
