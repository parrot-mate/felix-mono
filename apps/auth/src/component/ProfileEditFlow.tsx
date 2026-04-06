import { useCallback, useEffect, useMemo, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { useAtomValue, useSetAtom } from "jotai"
import { profileAtom, ProfileStepType, updateProfileAtom } from "@pmate/account-sdk"
import type { Profile } from "@pmate/meta"
import { useTranslation } from "@pmate/account-sdk"
import { useSnackbar } from "@pmate/uikit"
import { ProfileStepRender } from "./ProfileStepRender"

const EDITABLE_PROFILE_STEPS: ProfileStepType[] = [
  "nickname",
  "learning-language",
  "mother-tongue",
]

export const ProfileEditFlow = () => {
  const nav = useNavigate()
  const t = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const [params] = useSearchParams()
  const profile = useAtomValue(profileAtom)
  const updateProfile = useSetAtom(updateProfileAtom)
  const userId = profile?.id ?? ""
  const stepParam = params.get("step")
  const activeStep = useMemo(
    () => EDITABLE_PROFILE_STEPS.find((item) => item === stepParam) ?? null,
    [stepParam]
  )
  const [draft, setDraft] = useState<Partial<Profile>>({})

  useEffect(() => {
    if (!profile) {
      return
    }
    setDraft((current) => ({
      ...current,
      nickName: current.nickName ?? profile.nickName,
      learningTargetLang:
        current.learningTargetLang ?? profile.learningTargetLang,
      motherTongue: current.motherTongue ?? profile.motherTongue,
    }))
  }, [profile])

  const notifySuccess = useCallback(() => {
    enqueueSnackbar(t("Modification successful"), { variant: "success" })
  }, [enqueueSnackbar, t])

  const notifyFailure = useCallback(
    (message?: string) => {
      enqueueSnackbar(message || t("Failed"), { variant: "error" })
    },
    [enqueueSnackbar, t]
  )

  const handleContinue = useCallback(async () => {
    if (!profile || !userId) {
      notifyFailure()
      return
    }
    try {
      await updateProfile(userId, draft)
      notifySuccess()
      nav(-1)
    } catch (error: any) {
      notifyFailure(error?.message)
    }
  }, [
    draft,
    nav,
    notifyFailure,
    notifySuccess,
    profile,
    updateProfile,
    userId,
  ])

  const handleSkip = useCallback(() => {
    nav(-1)
  }, [nav])

  if (!activeStep) {
    return <Navigate to="/select-profile" replace />
  }

  if (!profile || !userId) {
    return <Navigate to="/login" replace />
  }

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
