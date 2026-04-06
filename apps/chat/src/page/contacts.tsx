import { ChatHomeTitleBar } from "@/component/chat/ChatHomeTitleBar"
import { contactsAtom } from "@pmate/sdk"
import { useTranslation } from "@pmate/i18n"
import {
  Avatar,
  IconButton,
  IconCancel,
  IconMate,
  IconPlayer,
  IconSearch,
  InputField,
  List,
  ListItem,
} from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { useDeferredValue, useMemo, useState } from "react"

export const Contacts = () => {
  const t = useTranslation()
  const { groupedList } = useAtomValue(contactsAtom)
  const { groups, users } = groupedList

  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const q = deferredSearch.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    if (!q) return groups
    return groups.filter((g) => (g.group.title || "").toLowerCase().includes(q))
  }, [groups, q])

  const filteredUsers = useMemo(() => {
    if (!q) return users
    const result: typeof users = {}
    Object.entries(users).forEach(([letter, list]) => {
      const matched = list.filter((u) => {
        const name = (
          u.profile.nickName ||
          u.profile.userName ||
          ""
        ).toLowerCase()
        return name.includes(q)
      })
      if (matched.length) result[letter] = matched
    })
    return result
  }, [users, q])

  const showEmpty =
    filteredGroups.length === 0 && Object.keys(filteredUsers).length === 0

  return (
    <div className="w-full h-full flex flex-col">
      <ChatHomeTitleBar />
      <div className="px-3 pt-3 pb-2 flex items-center">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconSearch className="w-5 h-5 text-gray-500" />
          </span>

          <InputField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("")
            }}
            placeholder={t("Search contacts or groups") as string}
            variant="primary"
            className="w-full pl-11 pr-9 py-3 text-sm placeholder:text-gray-500 border-gray-200 rounded-full"
          />

          {search && (
            <IconButton
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <IconCancel className="w-4 h-4" />
            </IconButton>
          )}
        </div>
      </div>

      <List className="flex-1 overflow-auto">
        {filteredGroups.length > 0 && (
          <div className="mb-[1.2rem]">
            <p className="pl-6 py-1 text-[0.875rem] text-violet-500 font-bold">
              {t("Groups")}
            </p>
            {filteredGroups.map((g) => (
              <ListItem
                key={g.group.id}
                className="flex items-center space-x-[0.75rem] ml-4"
              >
                <Avatar
                  src={g.group.avatar}
                  nickName={g.group.title}
                  className="bg-violet-500"
                  type="group"
                />
                <p className="text-[1rem] text-black">{g.group.title}</p>
              </ListItem>
            ))}
          </div>
        )}

        {Object.entries(filteredUsers).map(([letter, list]) => (
          <div key={letter} className="mb-[1.2rem]">
            <p className="pl-6 py-1 text-[0.875rem] text-violet-500 font-bold">
              {letter.toUpperCase()}
            </p>
            {list.map((u) => (
              <ListItem key={u.profile.id} className="flex items-center ml-4">
                <Avatar
                  src={u.profile.avatar}
                  nickName={u.profile.nickName || u.profile.userName}
                  type="user"
                />
                {u.profile.role === "mate" ? (
                  <IconMate className="w-[1.9rem] h-[1.9rem]" />
                ) : (
                  <IconPlayer className="w-[1.9rem] h-[1.9rem]" />
                )}
                <p className="text-[1rem] text-black ml-1.5">
                  {u.profile.nickName || u.profile.userName}
                </p>
              </ListItem>
            ))}
          </div>
        ))}

        {showEmpty && (
          <ListItem className="flex justify-center items-center h-full">
            <p className="text-gray-500">{t("No Results")}</p>
          </ListItem>
        )}
      </List>
    </div>
  )
}

export default Contacts
