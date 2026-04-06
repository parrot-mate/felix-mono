import type { LangShort } from "@pmate/meta"
import { LangSettingComponent } from "../LangSetting"
import { ProfileStepComponentProps } from "./types"

type MotherTongProps = ProfileStepComponentProps<LangShort>

export const MotherTong = ({ value, onChange }: MotherTongProps) => {
  return <LangSettingComponent value={value} onChange={onChange} />
}
