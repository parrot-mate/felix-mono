export type ProfileStepType =
  | "nickname"
  | "learning-language"
  | "mother-tongue"
  | "gender"
  | "is-adult"
  | "age"

const PROFILE_STEP_TYPE_SET: Record<ProfileStepType, true> = {
  nickname: true,
  "learning-language": true,
  "mother-tongue": true,
  gender: true,
  "is-adult": true,
  age: true,
}

export const isProfileStepType = (value: string): value is ProfileStepType => {
  return Boolean(PROFILE_STEP_TYPE_SET[value as ProfileStepType])
}

export interface ProfileStep {
  type: ProfileStepType
  title: string
  required: boolean
}
