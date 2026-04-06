import { useEffect, useRef } from "react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

interface EmojiPickerProps {
  open: boolean
  isDesktop: boolean
  motherLang: string
  onSelect: (emoji: string) => void
  onClose: () => void
}

export const EmojiPicker = ({
  open,
  isDesktop,
  motherLang,
  onSelect,
  onClose,
}: EmojiPickerProps) => {
  const emojiRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".emoji-toggle-btn")
      ) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, onClose])

  if (!open) return null

  return isDesktop ? (
    <div
      ref={emojiRef}
      className="absolute bottom-20 right-5 z-[1000] bg-white rounded-lg shadow-lg"
    >
      <Picker
        data={data}
        locale={motherLang}
        emojiSize={20}
        perLine={9}
        onEmojiSelect={(emoji: any) => onSelect(emoji.native)}
      />
    </div>
  ) : (
    <div
      ref={emojiRef}
      className="fixed bottom-0 left-0 w-full max-w-[480px] h-[220px] bg-[#f4f4f4] p-[6px] border-t border-[#ccc] z-[1000]"
    >
      <Picker
        data={data}
        locale={motherLang}
        emojiSize={28}
        perLine={8}
        previewPosition="none"
        navPosition="bottom"
        maxFrequentRows={1}
        onEmojiSelect={(emoji: any) => onSelect(emoji.native)}
      />
    </div>
  )
}
