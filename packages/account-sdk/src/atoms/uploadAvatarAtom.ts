import imageCompression from "browser-image-compression"
import { atom } from "jotai"
import { ProfileService } from "../api/ProfileService"

type UploadAvatarParams = {
  file: File
  userId: string
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"))
        return
      }
      const [, base64] = result.split(",")
      if (!base64) {
        reject(new Error("Failed to parse base64 data"))
        return
      }
      resolve(base64)
    }
    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }
    reader.readAsDataURL(file)
  })

export const uploadAvatarAtom = atom(
  null,
  async (_get, _set, { file, userId }: UploadAvatarParams) => {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 128,
      useWebWorker: true,
    })

    const base64 = await fileToBase64(compressed)

    return ProfileService.updateAvatar({
      user: userId,
      base64,
      filename: compressed.name,
    })
  }
)
