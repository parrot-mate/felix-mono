import Picker from "@emoji-mart/react"
import { IconButton, IconEmoji } from "@pmate/uikit"
import { useState } from "react"

export const EmojiInput = ({
  mode,
  onInsertEmoji,
  onSendEmoji,
}: {
  mode: "audio" | "text"
  onInsertEmoji: (emoji: string) => void
  onSendEmoji: (emoji: string) => void
}) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <IconEmoji className="w-6 h-6" />
      </IconButton>

      {open && (
        <div className="relative z-51">
          <Picker
            onEmojiSelect={(emoji: any) => {
              if (mode === "text") {
                onInsertEmoji(emoji.native)
              } else {
                onSendEmoji(emoji.native)
              }
              setOpen(false)
            }}
          />
        </div>
      )}
    </>
  )
}
