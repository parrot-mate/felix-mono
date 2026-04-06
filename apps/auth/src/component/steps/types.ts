import type { ProfileDraft } from "@pmate/account-sdk"

export interface ProfileStepComponentProps<TValue> {
  value: TValue
  onChange: (value: TValue) => void
  draft: ProfileDraft
}
