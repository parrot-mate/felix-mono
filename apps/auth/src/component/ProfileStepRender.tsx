import type { ProfileDraft } from "@pmate/account-sdk"
import { ProfileStepType, useAppBackgroundStyle } from "@pmate/account-sdk"
import { useTranslation } from "@pmate/account-sdk"
import type { LangShort, Profile } from "@pmate/meta"
import { Button } from "@pmate/uikit"
import {
  IsAdult,
  LearningLang,
  MotherTong,
  ProfileAge,
  ProfileGender,
  ProfileNickname,
} from "./steps"

interface ProfileStepRenderProps {
  step: ProfileStepType
  onChange: (nextDraft: ProfileDraft) => void
  draft: ProfileDraft
  onContinue: () => void
  onSkip: () => void
}

const STEP_TITLE_KEYS: Record<ProfileStepType, string> = {
  nickname: "Profile Step: Nickname",
  "learning-language": "Profile Step: Learning Language",
  "mother-tongue": "Profile Step: Mother Tongue",
  gender: "Profile Step: Gender",
  "is-adult": "Profile Step: Adult Confirmation",
  age: "Profile Step: Age",
}

export const ProfileStepRender = ({
  step,
  onChange,
  draft,
  onContinue,
  onSkip,
}: ProfileStepRenderProps) => {
  const t = useTranslation()
  const backgroundStyle = useAppBackgroundStyle()
  const stepTitle = t(STEP_TITLE_KEYS[step])
  const isRequired = step !== "mother-tongue"
  const value = (() => {
    if (step === "nickname") {
      return draft.nickName ?? ""
    }
    if (step === "learning-language") {
      return draft.learningTargetLang
    }
    if (step === "mother-tongue") {
      return draft.motherTongue
    }
    if (step === "gender") {
      return draft.gender
    }
    if (step === "age") {
      return draft.age
    }
    return draft.isAdult
  })()
  const isValueEmpty = value === "" || value === undefined || value === null
  const disableContinue = isRequired && isValueEmpty
  const disableSkip = isRequired

  return (
    <div
      className="w-full min-h-screen flex flex-col bg-cover bg-center"
      style={backgroundStyle}
    >
      <div className="flex-1">
        {step === "nickname" && (
          <ProfileNickname
            value={value as string}
            onChange={(next) =>
              onChange({
                ...draft,
                nickName: next,
              })
            }
            draft={draft}
          />
        )}
        {step === "learning-language" && (
          <LearningLang
            value={value as LangShort}
            onChange={(next) =>
              onChange({
                ...draft,
                learningTargetLang: next,
              })
            }
            draft={draft}
          />
        )}
        {step === "mother-tongue" && (
          <MotherTong
            value={value as LangShort}
            onChange={(next) =>
              onChange({
                ...draft,
                motherTongue: next,
              })
            }
            draft={draft}
          />
        )}
        {step === "gender" && (
          <ProfileGender
            value={value as Profile["gender"]}
            onChange={(next) =>
              onChange({
                ...draft,
                gender: next,
              })
            }
            draft={draft}
          />
        )}
        {step === "age" && (
          <ProfileAge
            value={value as number | undefined}
            onChange={(next) =>
              onChange({
                ...draft,
                age: next,
              })
            }
            draft={draft}
          />
        )}
        {step === "is-adult" && (
          <IsAdult
            value={value as boolean | undefined}
            onChange={(next) =>
              onChange({
                ...draft,
                isAdult: next,
              })
            }
            draft={draft}
          />
        )}
      </div>
      <div className="mt-auto flex items-center justify-center gap-3 pb-4">
        <Button variant="plain" disabled={disableSkip} onClick={onSkip}>
          {t("Skip")}
        </Button>
        <Button variant="step" disabled={disableContinue} onClick={onContinue}>
          {t("Continue")}
        </Button>
      </div>
    </div>
  )
}
