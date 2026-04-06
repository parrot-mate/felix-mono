import { ProfileService } from "./ProfileService"
import { Book } from "@pmate/meta"
import { blobToBase64 } from "@pmate/utils"

export async function saveBookData(
  user: string,
  bookId: string,
  data: Blob | string | Book,
  ext: string
): Promise<string> {
  let base64: string
  if (data instanceof Blob) {
    base64 = await blobToBase64(data)
  } else if (typeof data === "string") {
    base64 = utf8ToBase64(data)
  } else {
    base64 = utf8ToBase64(JSON.stringify(data))
  }
  const uploadUrl = await ProfileService.uploadUserFile({
    user,
    base64,
    filename: `${bookId}.${ext}`,
  })
  if (!uploadUrl) {
    throw new Error("upload failed")
  }
  return uploadUrl
}

function utf8ToBase64(str: string) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
}
