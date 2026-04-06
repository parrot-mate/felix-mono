import {
  AccountState,
  CreateProfileRequest,
  Profile,
  ProfileScope,
  UpdateProfileRequest,
} from "@pmate/meta"
import { resolveAppId } from "../utils/resolveAppId"
import { Api } from "./Api"

const PROFILE_ENDPOINT = "https://auth-api-v2.pmate.chat"
const UPLOADER_SERVICE_URL = "https://fc-uploader.skedo.cn".replace(/\/+$/, "")

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
    req: CreateProfileRequest,
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
    payload: UploadRequest,
  ): Promise<string> {
    const { filename, ...rest } = payload
    const resolvedFilename = filename ?? "upload"
    const ext = resolvedFilename.split(".").pop()?.toLowerCase() ?? ""
    const contentType = payload.contentType ?? EXTENSION_CONTENT_TYPE[ext]
    const response = await fetch(`${UPLOADER_SERVICE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(contentType ? { "x-file-content-type": contentType } : {}),
      },
      body: JSON.stringify({ ...rest, filename: resolvedFilename }),
    })
    if (!response.ok) {
      throw new Error("Upload failed")
    }
    const json = (await response.json()) as { data?: string }
    if (!json.data) {
      throw new Error("Upload failed")
    }
    return json.data
  }
}
