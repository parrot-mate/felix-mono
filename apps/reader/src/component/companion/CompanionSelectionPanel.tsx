import { userSettingsAtom } from "@pmate/account-sdk"
import { CharacterConfig, Characters } from "@/atom/companion/characters"
import { companionModalAtom } from "@/atom/ui/companionModalAtom"
import { Modal, Button } from "@pmate/uikit"
import { useAtom } from "jotai"
import { useState } from "react"

export const CompanionSelectionPanel = () => {
  const companions = Characters
  const [open, setOpen] = useAtom(companionModalAtom)
  const [currentCompanion, setCompanion] = useAtom(
    userSettingsAtom("companion")
  )
  const [selection, setSelection] = useState("")
  const selected = companions.find((x) => x.name === selection)

  return (
    <Modal
      open={open}
      onClose={() => {
        setOpen(false)
      }}
    >
      <div className="absolute w-[90%] h-[90%] top-[5%] left-[5%] p-5 overflow-hidden bg-white">
        <div className="h-full overflow-auto">
          <h2>选择伙伴</h2>
          {!selected && (
            <Button
              variant="plain"
              onClick={() => {
                setOpen(false)
              }}
            >
              返回
            </Button>
          )}
          {selected && (
            <Button
              variant="plain"
              onClick={() => {
                setSelection("")
              }}
            >
              返回
            </Button>
          )}
          {!selected && (
            <div className="grid grid-cols-2 gap-2">
              {companions.map((companion) => {
                const active = companion.name === currentCompanion
                return (
                  <div
                    key={companion.name}
                    className={`overflow-hidden border-[3px] ${
                      active ? "border-[#23d]" : "border-[#ccc]"
                    }`}
                    onClick={() => {
                      setSelection(companion.name)
                    }}
                  >
                    <img src={companion.image} className="w-full h-full" />
                  </div>
                )
              })}
            </div>
          )}
          {selected && (
            <CompanionCard
              companion={selected}
              onSelect={async () => {
                await setCompanion(selected.name)
                setOpen(false)
                // requestAnimationFrame(() => {
                //   window.location.reload()
                // })
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}

const CompanionCard = ({
  companion,
  onSelect,
}: {
  companion: CharacterConfig
  onSelect: () => void
}) => {
  return (
    <div className="p-[10px]">
      <div className="flex">
        <div className="flex-[2]">
          <img src={companion.image} className="w-full h-full" />
        </div>
        <div className="flex-[3] pl-[10px]">
          <h2>{companion.name}</h2>
          <p>年龄: {companion.age}</p>
          <p>身高：{companion.height}cm</p>
          <p>
            体重：
            {companion.weight}
          </p>
        </div>
      </div>
      <p></p>
      <p>{companion.desc}</p>
      <Button
        variant="secondary"
        onClick={() => {
          onSelect()
        }}
      >
        一起读书
      </Button>
    </div>
  )
}
