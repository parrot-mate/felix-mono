import { Profile } from "@pmate/meta"
import { profilesAtom, switchProfileAtom } from "@pmate/account-sdk"
import {
  Drawer,
  IconButton,
  IconClose,
  List,
  ListItem,
  Spinner,
  TitleBar,
} from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"

type ProfileSelectorProps = {
  open: boolean
  onClose: () => void
}

export const ProfileSelector = ({ open, onClose }: ProfileSelectorProps) => {
  const setProfile = useSetAtom(switchProfileAtom)
  const profilesLoadable = useAtomValue(profilesAtom)
  const profiles = profilesLoadable.unwrapOr([] as Profile[])

  const header = (
    <div className="bg-gray-100 px-4 py-3">
      <TitleBar
        title="选择用户"
        right={
          <IconButton className="w-9 h-9" onClick={onClose}>
            <IconClose className="w-5 h-5 text-gray-600" />
          </IconButton>
        }
      />
    </div>
  )

  const content = (() => {
    if (profilesLoadable.isPending() && !profilesLoadable.hasValue()) {
      return (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      )
    }

    if (profilesLoadable.isFail()) {
      return <div className="py-6 text-center text-gray-500">加载失败</div>
    }

    return (
      <List>
        {profiles.map((p) => (
          <ListItem
            key={p.id}
            onClick={async () => {
              await setProfile(p)
              onClose()
            }}
          >
            {p.nickName || p.name}
          </ListItem>
        ))}
      </List>
    )
  })()

  return (
    <Drawer open={open} onClose={onClose} anchor="bottom" className="h-[60vh] w-full rounded-t-2xl">
      {header}
      <div className="px-4 py-3">{content}</div>
    </Drawer>
  )
}
