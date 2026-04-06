import { AvatarUploader } from "@/component/account/AvatarUploader"
import { useTranslation } from "@pmate/i18n"
import { profileAtom, useAuthApp, userLogoutAtom } from "@pmate/account-sdk"
import {
  Divider,
  Drawer,
  IconButton,
  IconCopy,
  IconGroupAdd,
  IconLogout,
  IconMate,
  IconPlayer,
  IconQrCode,
  IconRight,
  IconUserAdd,
  Modal,
  useSnackbar,
} from "@pmate/uikit"
import clsx from "clsx"
import { useAtomValue, useSetAtom } from "jotai"
import { QRCodeCanvas } from "qrcode.react"
import { useState } from "react"
import { useNavigate } from "react-router"

export const ProfilePanel = ({
  open,
  onClose,
  app = "chat",
}: {
  open: boolean
  onClose: () => void
  app?: "chat" | "reader"
}) => {
  const user = useAtomValue(profileAtom)
  const logout = useSetAtom(userLogoutAtom)
  const nav = useNavigate()
  const t = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const [qrVisible, setQrVisible] = useState(false)
  const { createProfile, logout: logoutFromAuthApp, selectProfile } =
    useAuthApp()

  if (!user) {
    return null
  }


  const functionList = [
    {
      icon: <IconUserAdd className="text-gray-500 w-6 h-6" />,
      label: t("Add Friend"),
      onClick: () => {
        onClose()
        nav("/friend/find")
      },
      show: app === "chat",
    },
    {
      icon: <IconGroupAdd className="text-gray-500 w-6 h-6" />,
      label: t("Create Group"),
      onClick: () => {
        onClose()
        nav("/group/add")
      },
      show: app === "chat",
    },
    {
      icon: <IconLogout className="text-gray-300 w-6 h-6" />,
      label: t("Logout"),
      isTest: true,
      onClick: async () => {
        onClose()
        try {
          await logout()
        } finally {
          logoutFromAuthApp()
        }
      },
      show: true,
    },
  ]

  const badgeIcon =
    user.role === "practitioner" ? (
      <IconPlayer className="w-[1.9rem] h-[1.9rem]" />
    ) : (
      <IconMate className="w-[1.9rem] h-[1.9rem]" />
    )

  return (
    <>
      <Drawer
        id="profile-panel"
        open={open}
        onClose={onClose}
        anchor="right"
        overlayClassName="bg-black/30"
        className="w-[70vw] max-w-[300px] h-full"
      >
        <div className="flex flex-col h-full bg-white">
          <div
            className={clsx(
              "flex flex-col pl-[0.8rem]",
              user.role === "practitioner" ? "bg-violet-500" : "bg-rose-400"
            )}
            onClick={() => {
              nav("/profile")
            }}
          >
            <div className="flex flex-col mt-[1.8rem]">
              <div className="w-full h-[3.6rem] flex justify-between">
                <AvatarUploader badge={badgeIcon} />
                <div className="mr-[0.5rem] flex justify-center items-center">
                  <IconRight />
                </div>
              </div>
              <div
                data-testid="profile-nickname"
                className="text-white text-[0.8rem] font-bold pt-[0.5rem]"
              >
                {user.nickName}
              </div>
            </div>
            <div className="flex w-full items-center justify-between pr-4">
              <div className="flex items-center text-[0.65rem] text-white gap-1">
                <div>{user.userName}</div>
                <IconButton
                  className="text-white hover:bg-white/10 w-6 h-6"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    navigator.clipboard.writeText(user.userName)
                    enqueueSnackbar(t("Copied username to clipboard"))
                  }}
                >
                  <IconCopy className="w-4 h-4" />
                </IconButton>
              </div>
              <IconButton
                className="text-white hover:bg-white/10 w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setQrVisible(true)
                }}
              >
                <IconQrCode className="w-5 h-5" />
              </IconButton>
            </div>
          </div>

          {app === "chat" && (
            <>
              <div className="text-black text-[0.8rem] pl-[0.8rem] pt-[1.5rem] pb-[1.5rem]">
                {t("Switch Identity")}
              </div>
              <div className="px-[0.8rem] text-[0.75rem] text-gray-500">
                {t("Manage profiles in the auth center")}
              </div>
              <div className="mt-3 flex flex-col gap-2 px-[0.8rem] pb-3">
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-[0.85rem] text-slate-700 hover:bg-slate-50"
                  onClick={() => selectProfile()}
                >
                  {t("Switch profile")}
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-[0.85rem] text-slate-700 hover:bg-slate-50"
                  onClick={() => createProfile()}
                >
                  {t("Create profile")}
                </button>
              </div>
              <Divider />
            </>
          )}
          <div className="text-black text-[0.8rem] pl-[0.8rem] pt-[1.5rem] pb-[1.5rem]">
            {t("Function")}
          </div>
          <div className="pl-[0.8rem]">
            <div className="flex flex-col gap-2 mb-4">
              {functionList
                .filter((x) => x.show)
                .map((func, index) => (
                  <div
                    key={index}
                    className="text-sm border-none flex items-center text-black mb-[1.5rem]"
                    onClick={func.onClick}
                  >
                    <div className="mr-4">
                      <div className="w-[2.2rem] flex justify-center items-center">
                        {func.icon}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "text-[0.8rem] w-50",
                        func.isTest ? "text-gray-300" : "text-black"
                      )}
                    >
                      {func.label}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Drawer>
      <Modal
        open={qrVisible}
        onClose={() => setQrVisible(false)}
        overlayClassName="bg-black/40"
        className="rounded-2xl w-[19rem] max-w-[90vw] p-6"
      >
        <div className="flex flex-col gap-4 items-center">
          <div className="flex items-center gap-2">
            {badgeIcon}
            <div className="flex flex-col">
              <div className="text-base font-semibold text-gray-800">
                {user.nickName || t("My QR Code")}
              </div>
              <div className="text-sm text-gray-500">{user.userName}</div>
            </div>
          </div>
          <QRCodeCanvas value={user.userName} size={200} includeMargin />
          <div className="text-xs text-gray-500 text-center">
            {t("Let friends scan to fill your username automatically")}
          </div>
        </div>
      </Modal>
    </>
  )
}
