import { useAddTab } from "@/hook/useWordCardTabs"
import { supportTooltipAtom } from "@/hook/useSupportTooltip"
import { Maybe, SelectionHelper } from "@pmate/utils"
import { Box, Button, Divider, Popover } from "@mui/material"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { makeStyles } from "tss-react/mui"
import { tearModeAnalyzeAtom } from "@/atom/reading/tearModeAnalyzeAtom"
import { VocabularyStar } from "@/component/VocabularyStar"
import { profileAtom } from "@pmate/account-sdk"
import {
  AudioPlayers,
  audioPlayerAtom,
  usePlayAudio,
  vocabularyMapAtom,
} from "@pmate/sdk"

const useStyles = makeStyles()(() => ({
  button: {
    borderRadius: 0,
    fontSize: "0.9rem",
    padding: "5px 5px",
    minWidth: "0",
  },
}))

const MyDivider = () => {
  return (
    <Divider
      orientation="vertical"
      sx={{
        height: "20px",
        ml: "5px",
        mr: "5px",
      }}
    />
  )
}

export const SupportToolTip = () => {
  const [tooltip, setState] = useAtom(supportTooltipAtom)
  const addTab = useAddTab()
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const vmap = useAtomValue(vocabularyMapAtom(userId))
  const setTearMode = useSetAtom(tearModeAnalyzeAtom)

  // Replaced AudioPlayer.bookQueue usage with the new audioPlayerAtom
  const bookPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.BookPlayer))
  const { play } = usePlayAudio(bookPlayer)

  const close = () => {
    setState({
      anchor: null,
      word: "",
      book: Maybe.Nothing(),
      sentence: "",
      paragraph: "",
      sentenceID: "",
      pid: undefined,
    })
  }
  const isInVol = Boolean(vmap.search(tooltip.word))
  const { classes } = useStyles()
  return (
    <Popover
      open={Boolean(tooltip.anchor)}
      anchorEl={tooltip.anchor}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      sx={{
        "& .MuiPaper-root": {
          borderRadius: 0,
          padding: "0 10px",
        },
      }}
      onClose={() => close()}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          borderRadius: 0,
          alignItems: "center",
        }}
      >
        {isInVol && (
          <>
            <VocabularyStar word={tooltip.word} />
            <MyDivider />
          </>
        )}
        <Button
          variant="text"
          className={classes.button}
          onClick={() => {
            addTab(
              tooltip.word,
              tooltip.sentence,
              tooltip.paragraph,
              tooltip.book,
              tooltip.pid
            )
            close()
            if (tooltip.anchor && tooltip.sentence) {
              SelectionHelper.scrollTop20(tooltip.anchor)
            }
          }}
        >
          词义
        </Button>

        <MyDivider />
        <Button
          variant="text"
          className={classes.button}
          onClick={() => {
            setTearMode("sentence")
            close()
          }}
        >
          句子解析
        </Button>
      </Box>
    </Popover>
  )
}
