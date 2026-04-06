import { AccountManagerV2, useTranslation } from "@pmate/account-sdk"
import { Profile } from "@pmate/meta"
import { profilesAtom } from "@pmate/account-sdk"
import { Button, Divider, Spinner } from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { useNavigate, useSearchParams } from "react-router-dom"
import { switchProfileAtom, useAppBackgroundStyle } from "@pmate/account-sdk"

const SESSION_PARAM = "sessionId"

const buildRedirectUrl = (target: string, sessionId: string) => {
  try {
    const url = new URL(target, window.location.origin)
    url.searchParams.set(SESSION_PARAM, sessionId)
    return url.toString()
  } catch {
    const fallback = new URL(window.location.origin)
    fallback.searchParams.set(SESSION_PARAM, sessionId)
    return fallback.toString()
  }
}

export const SelectProfilePage = () => {
  const setProfile = useSetAtom(switchProfileAtom)
  const profilesLoadable = useAtomValue(profilesAtom)
  const profiles = profilesLoadable.unwrapOr([] as Profile[])
  const nav = useNavigate()
  const [params] = useSearchParams()
  const t = useTranslation()
  const backgroundStyle = useAppBackgroundStyle()
  const redirectTarget = params.get("redirect")
  const appParam = params.get("app")

  const buildCreateProfileUrl = () => {
    const nextParams = new URLSearchParams()
    nextParams.set("step", "learning-language")
    if (appParam) {
      nextParams.set("app", appParam)
    }
    if (redirectTarget) {
      nextParams.set("redirect", redirectTarget)
    }
    return `/create-profile?${nextParams.toString()}`
  }

  const redirectToTarget = () => {
    if (!redirectTarget) {
      return false
    }
    const token = AccountManagerV2.get(appParam ?? undefined).getAuthToken()
    if (!token) {
      return false
    }
    window.location.assign(buildRedirectUrl(redirectTarget, token))
    return true
  }

  if (profilesLoadable.isPending() && !profilesLoadable.hasValue()) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner className="w-12 h-12 text-white" />
      </div>
    )
  }

  if (profilesLoadable.isFail()) {
    return <div>加载失败</div>
  }

  const renderProfiles = () => (
    <div className="grid grid-cols-3 gap-y-8 gap-x-5 justify-center">
      {profiles.map((profile) => {
        const displayChar =
          profile.nickName.charAt(0).toUpperCase() ||
          profile.name.charAt(0).toUpperCase()

        return (
          <div key={profile.id} className="flex flex-col items-center">
            <Button
              className="w-[5rem] h-[5rem] rounded-full"
              variant="plain"
              onClick={async () => {
                setProfile(profile)
                if (!redirectToTarget()) {
                  nav("/", { replace: true })
                }
              }}
            >
              {displayChar}
            </Button>
            <div className="w-[5rem] h-[1rem] mt-[1rem] text-white flex items-center justify-center">
              @{profile.nickName || profile.name}
            </div>
          </div>
        )
      })}
      <div className="flex flex-col items-center">
        <Button
          className="w-[5rem] h-[5rem] rounded-full"
          variant="plain"
          onClick={() => {
            nav(buildCreateProfileUrl())
          }}
        >
          +
        </Button>
      </div>
    </div>
  )

  return (
    <div className="bg-cover bg-center w-full h-full pb-20" style={backgroundStyle}>
      <div className="text-[1.25rem] pt-[4.68rem] text-white font-normal flex justify-center items-center">
        {t("Please choose your identity")}
      </div>
      <div>
        <div className="practitioner mt-[3.75rem]">
          {profiles.length === 0 ? (
            <Button
              variant="plain"
              onClick={() => {
                nav(buildCreateProfileUrl())
              }}
            >
              +
            </Button>
          ) : (
            renderProfiles()
          )}
        </div>
        <div className="flex justify-center items-center my-[3.31rem]">
          <Divider orientation="horizontal" lengthClass="w-85" />
        </div>
        <div className="mate">
          {profiles.length === 0 ? (
            <Button
              variant="plain"
              onClick={() => {
                nav(buildCreateProfileUrl())
              }}
            >
              +
            </Button>
          ) : (
            renderProfiles()
          )}
        </div>
      </div>
    </div>
  )
}
