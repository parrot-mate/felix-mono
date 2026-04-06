import { Logo } from "@pmate/uikit"
import { FC } from "react"

interface I18nLabels {
  newWords?: string
  totalReading?: string
  todayReading?: string
  wordUnit?: string
}

interface Props {
  user: string
  nw: number
  // grasped: number
  todayWc: number
  reading: number
  onClick?: () => void
  text: string
  i18n?: I18nLabels
}

export const WelcomeCard: FC<Props> = ({
  text,
  nw,
  // grasped,
  reading,
  todayWc,
  i18n,
  onClick,
}) => {
  const labels = {
    newWords: "生词总数",
    totalReading: "总阅读量",
    todayReading: "今日阅读",
    wordUnit: "词",
    ...i18n,
  }
  return (
    <div className="max-w-[960px] p-[30px_20px]" onClick={onClick}>
      <div className="flex flex-row items-center justify-between">
        <Logo className="w-8 h-8" />
        <h2 className="text-2xl font-semibold flex-1 mx-4">{text}</h2>
      </div>
      <div className="flex flex-wrap justify-around px-[10px] mt-4">
        <div className="flex flex-col items-center m-2">
          <span className="text-sm text-gray-600">{labels.newWords}</span>
          <span className="text-lg font-bold">{nw}</span>
        </div>
        <div className="flex flex-col items-center m-2">
          <span className="text-sm text-gray-600">{labels.totalReading}</span>
          <span className="text-lg font-bold">
            {reading}
            {labels.wordUnit}
          </span>
        </div>
        <div className="flex flex-col items-center m-2">
          <span className="text-sm text-gray-600">{labels.todayReading}</span>
          <span className="text-lg font-bold">
            {todayWc}
            {labels.wordUnit}
          </span>
        </div>
      </div>
    </div>
  )
}
