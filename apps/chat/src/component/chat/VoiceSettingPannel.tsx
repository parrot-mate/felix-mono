import { MenuItem, Select, TextField } from "@mui/material"
import { VoiceList } from "@pmate/meta"
import { userSettingsAtom } from "@pmate/account-sdk"
import { Voice } from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { useTranslation } from "@pmate/i18n"
import { useAtom } from "jotai"
import { debounce } from "lodash"
import { useCallback } from "react"

const logger = Logger.getDebugger("ThreadList")

export const VoiceSettingPannel = () => {
  const list = Object.values(VoiceList)
  const [voice, setVoice] = useAtom(userSettingsAtom("chatVoice@v2"))

  const t = useTranslation()
  logger.log(`${voice?.provider}:${voice?.name}`)
  const debounceUpdate = useCallback(
    debounce((str: string) => {
      if (voice && voice.provider === "openai") {
        setVoice({
          ...voice,
          instructions: str,
        })
      }
    }, 300),
    []
  )
  return (
    <>
      <Select
        className="w-full"
        value={`${voice?.provider}:${voice?.name}`}
        onChange={async (e) => {
          const key = e.target.value as string
          const voice: Voice | undefined = list.find(
            (x) => `${x.provider}:${x.name}` === key
          )
          if (voice) {
            const copy = { ...voice }
            setVoice(copy)
          }
        }}
      >
        {list.map((item) => {
          const key = `${item.provider}:${item.name}`
          return (
            <MenuItem value={key} key={key}>
              {item.provider} - {item.gender} - {item.name}
            </MenuItem>
          )
        })}
      </Select>
      <div className="mt-2">
        <TextField
          className="w-full"
          multiline
          rows={4}
          onChange={(e) => {
            const t = e.target as HTMLInputElement
            debounceUpdate(t.value as string)
          }}
          placeholder={t("Instructions(Optional)")}
          defaultValue={voice?.instructions}
        ></TextField>
      </div>
    </>
  )
}
