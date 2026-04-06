import { SocialService } from "@sdk/api"
import type {
  ContactInfo,
  DMContact,
  GroupContact,
  GroupInfo,
  Profile,
} from "@pmate/meta"
import { atom } from "jotai"
import { profileAtom } from "@pmate/account-sdk"

const verAtom = atom(0)
export const refreshContactsAtom = atom(null, (_, set) => {
  set(verAtom, (v) => v + 1)
})
interface ContactsData {
  list: ContactInfo[]
  groupedList: { groups: GroupContact[]; users: Record<string, DMContact[]> }
}

export const contactsAtom = atom<Promise<ContactsData>>(async (get) => {
  get(verAtom)
  const profile = get(profileAtom)
  const userId = profile?.id ?? ""
  if (!userId) {
    return {
      list: [],
      groupedList: { groups: [], users: {} as Record<string, DMContact[]> },
    } as ContactsData
  }
  try {
    const contacts = await SocialService.getContacts(userId)
    const list: ContactInfo[] = contacts
      .map((item) => {
        if (isGroupInfo(item)) {
          return toGroupContact(item)
        }
        return toDMContact(item)
      })
      .filter((contact): contact is ContactInfo => !!contact)

    const groupedList = groupContacts(list)
    return { list, groupedList } as ContactsData
  } catch (ex) {
    console.warn(ex)
    return {
      list: [] as ContactInfo[],
      groupedList: {
        groups: [] as GroupContact[],
        users: {} as Record<string, DMContact[]>,
      },
    } as ContactsData
  }
})

const isGroupInfo = (entry: Profile | GroupInfo): entry is GroupInfo => {
  return Array.isArray((entry as GroupInfo).members)
}

const toGroupContact = (group: GroupInfo): GroupContact => ({
  type: "group",
  group,
})

const toDMContact = (profile: Profile): DMContact => ({
  type: "dm",
  profile,
})

const groupContacts = (list: ContactInfo[]) => {
  const grouped = {
    groups: [] as GroupContact[],
    users: {} as Record<string, DMContact[]>,
  }
  for (const item of list) {
    if (item.type === "group") {
      grouped.groups.push(item)
      continue
    }
    const name = item.profile.nickName
    const first = name?.[0]?.toLowerCase() || ""
    const key = first >= "a" && first <= "z" ? first : "#"
    ;(grouped.users[key] ||= []).push(item)
  }
  grouped.groups.sort((a, b) => a.group.title.localeCompare(b.group.title))
  Object.values(grouped.users).forEach((arr) =>
    arr.sort((a, b) => a.profile.userName.localeCompare(b.profile.userName))
  )
  const sortedKeys = Object.keys(grouped.users).sort((a, b) => {
    if (a === "#") return 1
    if (b === "#") return -1
    return a.localeCompare(b)
  })
  const sortedUsers: Record<string, DMContact[]> = {}
  for (const k of sortedKeys) {
    sortedUsers[k] = grouped.users[k]
  }
  grouped.users = sortedUsers
  return grouped
}
