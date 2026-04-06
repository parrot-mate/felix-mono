import { useTranslation } from "@pmate/i18n"
import { IconButton, IconMenu } from "@pmate/uikit"
import { getSafeInsets } from "@pmate/bridge"
import { atom, useAtomValue } from "jotai"
import clsx from "clsx"
import { useLocation, useNavigate } from "react-router"
import { useState } from "react"
import { ProfilePanel } from "./ProfilePanel"

const safeInsetsNativeAtom = atom(async () => {
  return getSafeInsets()
})

export const ChatHomeTitleBar = ({ className }: { className?: string }) => {
  const t = useTranslation()
  const nav = useNavigate()
  const location = useLocation()
  const safeInsets = useAtomValue(safeInsetsNativeAtom)
  const [open, setOpen] = useState(false)

  const tabs = [
    { key: "treehole", label: t("Tree Hole"), path: "/coming-soon" },
    { key: "chat", label: t("Chat"), path: "/" },
    { key: "contacts", label: t("Contacts"), path: "/contacts" },
  ]

  const current = location.pathname === "/" ? "/" : location.pathname

  return (
    <>
      <div
        style={{
          paddingTop: safeInsets ? `${safeInsets.top + 10}px` : `19.5px`,
        }}
        className={clsx(
          "flex items-center justify-between bg-gradient-parrot pt-[50px] pb-[19.5px] pl-[10px] pr-[10px]",
          className
        )}
      >
        <div className="flex space-x-4">
          {tabs.map((tab) => {
            const active = current === tab.path
            return (
              <button
                key={tab.key}
                className={clsx(
                  "relative text-[14px] transition-all duration-300 ease-out transform",
                  active
                    ? "text-[18px] text-white translate-y-[-2px]"
                    : "text-gray-200 scale-100 translate-y-0"
                )}
                onClick={() => nav(tab.path)}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
        <IconButton
          data-testid="profile-menu-button"
          aria-label="Open profile panel"
          onClick={() => {
            setOpen(true)
          }}
        >
          <IconMenu className="text-white w-6 h-6" />
        </IconButton>
      </div>
      <ProfilePanel
        open={open}
        onClose={() => {
          setOpen(false)
        }}
      />
    </>
  )
}
