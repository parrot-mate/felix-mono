import { Endpoints, networkUnstableAtom, useRoomContext } from "@pmate/sdk"
import { useAtomValue } from "jotai"
import { useMemo } from "react"
import { MateInput } from "./MateInput"
import { PractitionerMessageInput } from "./PractitionerInput"

export const MessageInput = () => {
  const { role } = useRoomContext()
  const endpoints = useMemo(() => [Endpoints.hub, Endpoints.room], [])
  const networkUnstable = useAtomValue(networkUnstableAtom(endpoints))

  return (
    <div
      data-uikit="bottom_navbar"
      aria-disabled={networkUnstable}
      className={`flex items-center justify-center bg-[#f2f3f3] px-[10px] py-[10px] min-h-[80px] ${
        networkUnstable ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {role === "practitioner" && <PractitionerMessageInput />}
      {role === "mate" && <MateInput />}
    </div>
  )
}
