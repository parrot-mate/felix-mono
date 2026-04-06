import { IconButton, IconPlus } from "@pmate/uikit"
import { FC, useState } from "react"

interface FileUploaderProps {
  onChange: (file: File) => void
  accept?: string
  label: string
}
export const FileUploader: FC<FileUploaderProps> = ({
  onChange,
  label,
  accept,
}) => {
  const [round, setRound] = useState(0)
  return (
    <div className="relative inline-block">
      <IconButton className="z-0 flex flex-col items-center gap-1">
        <IconPlus />
        <span>{label}</span>
      </IconButton>
      <input
        type="file"
        key={"rnd-" + round}
        accept={accept || ".epub, .txt, .mobi, .pdf"}
        onChange={(e) => {
          const files = e.target.files
          if (files && files.length > 0) {
            const file = files[0]
            onChange(file)
            setRound((x) => x + 1)
          }
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  )
}
