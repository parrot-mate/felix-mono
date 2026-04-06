import { VoiceList } from "@pmate/meta"
import { userSettingsAtom } from "@pmate/account-sdk"
import { Voice } from "@pmate/meta"
import { useTranslation } from "@pmate/i18n"
import { Button, Drawer, IconButton, IconCancel } from "@pmate/uikit"
import clsx from "clsx"
import { useAtom, useSetAtom } from "jotai"
import { deleteFriendAtom } from "@/atom/chat/deleteFriendAtom"
import { exitGroupAtom } from "@/atom/chat/exitGroupAtom"

interface Props {
  open: boolean
  onClose: () => void
  type: "dm" | "group"
  threadHash: string
  otherId?: string
}

export const ChatSettingsPanel = ({
  open,
  onClose,
  type,
  threadHash,
  otherId,
}: Props) => {
  const t = useTranslation()
  const deleteFriend = useSetAtom(deleteFriendAtom)
  const exitGroup = useSetAtom(exitGroupAtom)
  const list = Object.values(VoiceList)
  const [voice, setVoice] = useAtom(userSettingsAtom("chatVoice@v2"))

  const handleAction = async () => {
    if (type === "dm" && otherId) {
      await deleteFriend({ threadHash, otherId })
    } else if (type === "group") {
      await exitGroup(threadHash)
    }
    onClose()
    history.go(-1)
  }

  const label = type === "dm" ? t("Remove Contact") : t("Exit Group")

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="bottom"
      overlayClassName="bg-black/30"
      className="w-full"
    >
      <div className="p-4 pb-12">
        <div className="flex justify-between items-center mb-4">
          <h2>{t("Chat Settings")}</h2>
          <div className="flex justify-end">
            <IconButton onClick={onClose}>
              <IconCancel />
            </IconButton>
          </div>
        </div>
        <div className="mb-4">
          <select
            className="w-full border p-2"
            value={`${voice?.provider}:${voice?.name}`}
            onChange={(e) => {
              const key = e.target.value
              const v: Voice | undefined = list.find(
                (x) => `${x.provider}:${x.name}` === key
              )
              if (v) {
                const copy = { ...v }
                setVoice(copy)
              }
            }}
          >
            {list.map((item) => {
              const key = `${item.provider}:${item.name}`
              return (
                <option value={key} key={key}>
                  {item.provider} - {item.gender} - {item.name}
                </option>
              )
            })}
          </select>
        </div>
        <Button
          variant="secondary"
          className={clsx("text-left px-4 py-2 text-black hover:bg-gray-100")}
          onClick={handleAction}
        >
          {label}
        </Button>
      </div>
    </Drawer>
  )
}
