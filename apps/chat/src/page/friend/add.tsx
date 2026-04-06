import { profileByIdAtom, userSettingsAtom } from "@pmate/account-sdk"
import { useTranslation } from "@pmate/i18n"
import { LangShort } from "@pmate/meta"
import { requestFriendAtom } from "@pmate/sdk"
import {
  Avatar,
  Button,
  Divider,
  IconArrowBack,
  IconButton,
  InputField,
} from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

export const AddFriend = () => {
  const t = useTranslation()
  const nav = useNavigate()
  const { profileId } = useParams<{ profileId: string }>()
  const [msg, setMsg] = useState("hi")
  const voice = useAtomValue(userSettingsAtom("chatVoice@v2"))
  const requestFriend = useSetAtom(requestFriendAtom)
  const userProfile = useAtomValue(profileByIdAtom(profileId || ""))
  console.log("userProfile", userProfile)
  const handleAdd = async () => {
    if (!profileId) return
    await requestFriend({
      to: profileId,
      text: msg,
      lang: "en" as LangShort,
      voice,
    })
    nav(`/chat/dm/${profileId}`, { replace: true })
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-[12rem] bg-violet-500 relative">
        <IconButton className="mt-4 ml-4">
          <IconArrowBack className="text-white" onClick={() => nav(-1)} />
        </IconButton>
      </div>
      <div className="-mt-[3.125rem] px-2 flex flex-col items-center">
        <Avatar
          src={userProfile?.avatar}
          nickName={userProfile?.nickName || ""}
          size="profileSize"
          upload={false}
        />
        <div className="mt-3 text-black text-[18px]">
          {userProfile?.nickName}
        </div>
        <div className="text-black text-[9px]">
          {userProfile?.userName || ""}
        </div>
        <div className="mt-1 text-gray-500 text-[14px]">
          My voice makes connection cute!
        </div>
      </div>

      <div className="w-full flex justify-center items-center">
        <Divider className="mt-4 mb-2" lengthClass="w-[21rem]" />
      </div>

      <div className="w-full h-full flex flex-col">
        <div className="p-4 flex justify-center gap-4">
          <InputField
            type="text"
            placeholder={t("Say Hi")}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className=""
          />
          <Button className="px-5 py-2" onClick={handleAdd}>
            {t("Add")}
          </Button>
        </div>
      </div>
    </div>
  )
}
