import { aiImageAtom } from "@/atom/aigen/aiImageAtom"
import { AIImgRequest, AIImgType } from "@pmate/meta"
import { Button, IconButton, IconDownload, Spinner } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { Suspense } from "react"

interface AIGenWordImageProps {
  req: AIImgRequest<AIImgType>
  autoload?: boolean
  style?: React.CSSProperties
  download?: boolean
  imageStyle?: React.CSSProperties
}

// Any placeholder image you have:

export const AIImage = ({
  req,
  style,
  imageStyle,
  download,
}: AIGenWordImageProps) => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-6">
          <Spinner />
        </div>
      }
    >
      <LoadingImage
        req={req}
        style={style}
        download={download}
        imageStyle={imageStyle}
      />
    </Suspense>
  )
}

const LoadingImage = ({
  req,
  style,
  download,
  imageStyle,
}: {
  req: AIImgRequest<AIImgType>
  style?: React.CSSProperties
  download?: boolean
  imageStyle?: React.CSSProperties
}) => {
  const result = useAtomValue(aiImageAtom(req))
  const retry = useSetAtom(aiImageAtom(req))
  if (result.isFail()) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          position: "relative",
          ...style,
        }}
      >
        生成失败
        <Button
          onClick={() => {
            retry()
          }}
        >
          重新加载
        </Button>
      </div>
    )
  }
  if (result.isPending() || !result.value) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    )
  }
  const url = result.value
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "relative",
        ...style,
      }}
    >
      <img
        src={url}
        alt="AI Generated"
        style={{ maxHeight: "100%", maxWidth: "100%", ...imageStyle }}
      />
      {download && (
        <div className="absolute right-[10px] bottom-[10px] z-[100]">
          <IconButton
            onClick={() => {
              const a = document.createElement("a")
              a.href = url
              a.download = url
              a.target = "_blank"
              a.click()
            }}
          >
            <IconDownload className="text-white w-5 h-5" />
          </IconButton>
        </div>
      )}
    </div>
  )
}
