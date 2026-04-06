import { useTranslation } from "@pmate/i18n"
import { Msg, MsgOp } from "@pmate/meta"
import { useCallback, useState } from "react"
import { MessageCardDisplay } from "./MessageCardDisplay"

type Props = {
  msg: Msg<MsgOp.IMAGE>
}

export const ImageMessageCard = ({ msg }: Props) => {
  const t = useTranslation()
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const url = msg.body.url

  const openImage = useCallback(() => {
    if (typeof window === "undefined" || !url) {
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }, [url])

  const handleLoad = () => {
    setStatus("ready")
  }

  const handleError = () => {
    setStatus("error")
  }

  const isLoading = status === "loading"
  const hasError = status === "error"

  return (
    <MessageCardDisplay
      msg={msg}
      onClick={openImage}
      onViewDetail={openImage}
      contentAlign="start"
    >
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 cursor-zoom-in ${
          isLoading ? "w-[200px] h-[200px]" : ""
        }`}
      >
        {hasError ? (
          <div className="px-4 py-6 text-center text-xs text-gray-500">
            {t("Unable to load image")}
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                {t("Loading image...")}
              </div>
            )}
            <img
              src={url}
              alt={t("Shared image")}
              className={`block max-w-[280px] max-h-[360px] object-contain transition-opacity duration-200 ${
                status === "ready" ? "opacity-100" : "opacity-0"
              }`}
              onLoad={handleLoad}
              onError={handleError}
            />
          </>
        )}
      </div>
    </MessageCardDisplay>
  )
}
