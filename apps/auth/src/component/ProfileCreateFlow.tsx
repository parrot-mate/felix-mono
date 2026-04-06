import { useCallback, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAtomValue, useSetAtom } from "jotai"
import {
  AccountManagerV2,
  createProfileAtom,
  motherTongueAtom,
  profileAtom,
  profileDraftAtom,
  switchProfileAtom,
  useProfileStepFlow,
} from "@pmate/account-sdk"
import { useTranslation } from "@pmate/account-sdk"
import { useSnackbar } from "@pmate/uikit"
import { ProfileStepRender } from "./ProfileStepRender"

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

export const ProfileCreateFlow = () => {
  const nav = useNavigate()
  const t = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const [params] = useSearchParams()
  const profile = useAtomValue(profileAtom)
  const draft = useAtomValue(profileDraftAtom)
  const setDraft = useSetAtom(profileDraftAtom)
  const setProfile = useSetAtom(switchProfileAtom)
  const createProfile = useSetAtom(createProfileAtom)
  const motherTongue = useAtomValue(motherTongueAtom)
  const draftNickName = draft.nickName ?? ""
  const redirectTarget = params.get("redirect")
  const appParam = params.get("app")
  const { activeStep, buildStepUrl, nextStep } = useProfileStepFlow({
    params,
  })

  useEffect(() => {
    if (activeStep !== "mother-tongue" || draft.motherTongue) {
      return
    }
    setDraft((current) => ({
      ...current,
      motherTongue,
    }))
  }, [activeStep, draft.motherTongue, motherTongue, setDraft])

  const notifySuccess = useCallback(() => {
    enqueueSnackbar(t("Modification successful"), { variant: "success" })
  }, [enqueueSnackbar, t])

  const notifyFailure = useCallback(
    (message?: string) => {
      enqueueSnackbar(message || t("Failed"), { variant: "error" })
    },
    [enqueueSnackbar, t]
  )

  const redirectToTarget = useCallback(() => {
    if (!redirectTarget) {
      return false
    }
    const token = AccountManagerV2.get(appParam ?? undefined).getAuthToken()
    if (!token) {
      return false
    }
    window.location.assign(buildRedirectUrl(redirectTarget, token))
    return true
  }, [appParam, redirectTarget])

  const handleCreateMode = useCallback(
    async (nickname: string) => {
      try {
        const nextProfile = await createProfile({ nickName: nickname })
        if (!nextProfile) {
          notifyFailure()
          return
        }
        if (!profile) {
          await setProfile(nextProfile)
        }
        setDraft({})
        notifySuccess()
        if (!redirectToTarget()) {
          nav("/", { replace: true })
        }
      } catch (error: any) {
        notifyFailure(error?.message)
      }
    },
    [
      createProfile,
      nav,
      notifyFailure,
      notifySuccess,
      profile,
      redirectToTarget,
      setDraft,
      setProfile,
    ]
  )

  const handleContinue = useCallback(async () => {
    if (nextStep) {
      nav(buildStepUrl(nextStep))
      return
    }
    await handleCreateMode(draftNickName)
  }, [buildStepUrl, draftNickName, handleCreateMode, nav, nextStep])

  const handleSkip = useCallback(() => {
    if (nextStep) {
      nav(buildStepUrl(nextStep))
      return
    }
    if (!redirectToTarget()) {
      nav("/")
    }
  }, [buildStepUrl, nav, nextStep, redirectToTarget])

  return (
    <ProfileStepRender
      step={activeStep}
      onChange={(nextDraft) => setDraft(nextDraft)}
      draft={draft}
      onContinue={handleContinue}
      onSkip={handleSkip}
    />
  )
}
