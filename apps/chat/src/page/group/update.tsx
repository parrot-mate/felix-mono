import { atomWithLoadable } from "@/atom/atomWithLoadable"
import { updateGroupAtom } from "@/atom/chat/updateGroupAtom"
import { ChatTitleBar } from "@/component/chat/ChatTitleBar"
import { profileAtom } from "@pmate/account-sdk"
import {
  ProfileService,
  contactsAtom,
  roomAtom,
} from "@pmate/sdk"
import { ContactInfo } from "@pmate/meta"
import { useTranslation } from "@pmate/i18n"
import {
  Avatar,
  Button,
  Checkbox,
  Divider,
  InputField,
  List,
  ListItem,
  useSnackbar,
} from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router"

const friendsAtom = atomWithLoadable(async (get) => {
  const { list } = await get(contactsAtom)
  return list.filter((c) => c.type === "dm")
})

interface FieldValues {
  groupName: string
}

export const UpdateGroup = () => {
  const { threadHash = "" } = useParams<{ threadHash: string }>()
  const room = useAtomValue(roomAtom(threadHash))
  const updateGroup = useSetAtom(updateGroupAtom)
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const t = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const nav = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FieldValues>()
  const friendsLoadable = useAtomValue(friendsAtom)
  const friends = friendsLoadable.unwrapOr([] as ContactInfo[])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [avatar, setAvatar] = useState("")

  useEffect(() => {
    if (room) {
      setValue("groupName", room.info.title || "")
      setAvatar(room.info.avatar || "")
      setSelected(new Set(room.peers))
    }
  }, [room, setValue])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAvatarFile = useCallback(
    async (base64: string) => {
      if (!userId) return
      try {
        const url = await ProfileService.updateAvatar({
          user: userId,
          base64,
          filename: "group.png",
        })
        if (!url) {
          enqueueSnackbar(t("Failed"), { variant: "error" })
          return
        }
        setAvatar(url)
      } catch (ex: any) {
        enqueueSnackbar(ex.message || t("Failed"), { variant: "error" })
      }
    },
    [userId, enqueueSnackbar, t]
  )

  if (!room) {
    return null
  }

  const onSubmit = async (data: FieldValues) => {
    try {
      await updateGroup(threadHash, data.groupName, avatar, [...selected])
      enqueueSnackbar(t("Group updated"), { variant: "success" })
      const groupId = threadHash.replace(/^group@/, "")
      nav(`/chat/group/${groupId}`)
    } catch (ex: any) {
      enqueueSnackbar(ex.message || t("Failed"), { variant: "error" })
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <ChatTitleBar title={t("Update Group")} variant="solid" />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(onSubmit)()
        }}
        className="p-2 flex-1 flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <Avatar
            src={avatar}
            nickName={room.info.title || ""}
            className="w-16 h-16"
            upload
            onUploadFile={handleAvatarFile}
          />
          <div className="flex-1 flex flex-col gap-1">
            <InputField
              type="text"
              placeholder={t("Group Name")}
              {...register("groupName", {
                required: t("Group Name is required"),
              })}
              className="px-2 py-1 w-full"
            />
            {errors.groupName && (
              <div className="text-red-500 text-sm">
                {errors.groupName.message}
              </div>
            )}
          </div>
        </div>
        <Divider />
        {friendsLoadable.isPending() ? (
          <div>{t("Loading...")}</div>
        ) : (
          <List className="flex-1 overflow-auto">
            {friends.map((f) => (
              <ListItem key={f.profile.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selected.has(f.profile.id)}
                  onChange={() => toggle(f.profile.id)}
                />
                <Avatar
                  src={f.profile.avatar}
                  nickName={f.profile.nickName}
                  className="w-8 h-8"
                />
                <span>{f.profile.nickName}</span>
              </ListItem>
            ))}
          </List>
        )}
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={selected.size === 0}
          className="mt-2 self-center"
        >
          {t("Update")}
        </Button>
      </form>
    </div>
  )
}
