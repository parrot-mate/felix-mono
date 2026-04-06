import { AccountModalPhase, userAccountModalAtom } from "@/atom/modalAtoms"
import { profileAtom } from "@pmate/account-sdk"
import { Button } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"

export const NotLogin = () => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const showLogin = useSetAtom(userAccountModalAtom)

  if (userId) {
    return null
  }
  const handleClick = () => {
    showLogin((x) => {
      return {
        ...x,
        open: true,
        phase: AccountModalPhase.Login,
      }
    })
  }
  return (
    <div
      className="flex items-center justify-center"
      onClick={handleClick}
    >
      您还没有登陆
      <Button variant="plain" onClick={handleClick}>
        点击这里登陆
      </Button>
    </div>
  )
}
