import { profileAtom } from "@pmate/account-sdk"
import { ProfileService, useRoomContext, useSendMessage } from "@pmate/sdk"
import { MsgOp } from "@pmate/meta"
import { useTranslation } from "@pmate/i18n"
import { IconButton, IconImage, useSnackbar } from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { ChangeEvent, useCallback, useRef, useState } from "react"

export const ChatImageInput = () => {
  const { toId } = useRoomContext()
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const sendMsg = useSendMessage()
  const { enqueueSnackbar } = useSnackbar()
  const t = useTranslation()

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !userId) {
        return
      }
      event.target.value = ""
      setUploading(true)

      try {
        if (!file.type.startsWith("image/")) {
          throw new Error(t("Please choose an image file"))
        }
        const { base64, filename } = await convertFileToWebpBase64(file)
        const url = await ProfileService.uploadMsgImage({
          user: userId,
          base64,
          filename,
        })
        await sendMsg(toId, MsgOp.IMAGE, { url })
        enqueueSnackbar(t("Image sent"), {
          variant: "success",
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("Failed to upload image")
        enqueueSnackbar(message, { variant: "error" })
      } finally {
        setUploading(false)
      }
    },
    [enqueueSnackbar, sendMsg, t, toId, userId]
  )

  const openFilePicker = () => {
    if (uploading) {
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <>
      <IconButton
        className="relative z-[1001]"
        onClick={openFilePicker}
        disabled={!userId || uploading}
      >
        <IconImage className="w-6 h-6" />
      </IconButton>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  )
}

async function convertFileToWebpBase64(file: File) {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  if (!image.width || !image.height) {
    throw new Error("Image has no content")
  }

  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Canvas is not supported in this browser")
  }
  context.drawImage(image, 0, 0)
  const webpDataUrl = canvas.toDataURL("image/webp", 1)
  const [, base64 = ""] = webpDataUrl.split(",")
  if (!base64) {
    throw new Error("Failed to convert image to WebP")
  }
  const basename = file.name.replace(/\.[^/.]+$/, "") || "chat-image"
  return {
    base64,
    filename: `${basename}-${Date.now()}.webp`,
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = () => {
      reject(reader.error || new Error("Failed to read file"))
    }
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load image"))
    image.src = src
  })
}
