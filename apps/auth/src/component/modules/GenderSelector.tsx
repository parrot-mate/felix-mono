import { useAtomValue } from "jotai"
import { profileAtom } from "@pmate/account-sdk"

interface GenderSelectorProps {
  onSelect: (gender: "M" | "F") => void
}

const getButtonStyle = (active: boolean) =>
  [
    "flex flex-col items-center p-2 rounded transition-colors",
    active ? "ring-2 ring-primary bg-primary/10" : "ring-1 ring-transparent",
  ].join(" ")

export const GenderSelector = ({ onSelect }: GenderSelectorProps) => {
  const profile = useAtomValue(profileAtom)
  const current = profile?.gender

  return (
    <div className="flex items-center w-full mb-4">
      <label className="flex-3 text-right shrink-0 mr-5">性别:</label>
      <div className="flex-7 flex justify-start space-x-8">
        <button
          type="button"
          onClick={() => onSelect("F")}
          className={getButtonStyle(current === "F")}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-lg font-semibold text-white">
            F
          </span>
          <span className="text-sm mt-1">女</span>
        </button>
        <button
          type="button"
          onClick={() => onSelect("M")}
          className={getButtonStyle(current === "M")}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white">
            M
          </span>
          <span className="text-sm mt-1">男</span>
        </button>
      </div>
    </div>
  )
}
