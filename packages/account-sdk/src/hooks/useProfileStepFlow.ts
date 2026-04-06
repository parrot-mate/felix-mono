import { useCallback, useMemo } from "react"
import { getAppConfig } from "../app.config"
import { isProfileStepType, ProfileStepType } from "../utils/profileStep"

const DEFAULT_CREATE_STEP: ProfileStepType = "learning-language"

type UseProfileStepFlowParams = {
  params: URLSearchParams
}

export const useProfileStepFlow = ({
  params,
}: UseProfileStepFlowParams) => {
  const appParam = params.get("app")
  const redirectParam = params.get("redirect")
  const appConfig = useMemo(() => getAppConfig(appParam), [appParam])
  const appProfileSteps = useMemo<ProfileStepType[]>(
    () =>
      appConfig.profiles
        .map((profile) => profile.type)
        .filter((type): type is ProfileStepType => isProfileStepType(type)),
    [appConfig.profiles]
  )
  const stepParam = params.get("step")
  const normalizedStep: ProfileStepType | null =
    appProfileSteps.find((item) => item === stepParam) ?? null
  const defaultStep: ProfileStepType = appProfileSteps[0] ?? DEFAULT_CREATE_STEP
  const activeStep: ProfileStepType = normalizedStep ?? defaultStep
  const createSteps = useMemo<ProfileStepType[]>(() => {
    return appProfileSteps.length > 0 ? appProfileSteps : [DEFAULT_CREATE_STEP]
  }, [appProfileSteps])
  const currentStepIndex = createSteps.indexOf(activeStep)
  const nextStep =
    currentStepIndex >= 0 ? createSteps[currentStepIndex + 1] : undefined
  const isCreateFlowStep = createSteps.includes(activeStep)
  const buildStepUrl = useCallback(
    (next: ProfileStepType) => {
      const search = new URLSearchParams()
      search.set("step", next)
      if (appParam) {
        search.set("app", appParam)
      }
      if (redirectParam) {
        search.set("redirect", redirectParam)
      }
      return `/create-profile?${search.toString()}`
    },
    [appParam, redirectParam]
  )

  return {
    activeStep,
    appProfileSteps,
    buildStepUrl,
    createSteps,
    isCreateFlowStep,
    nextStep,
  }
}
