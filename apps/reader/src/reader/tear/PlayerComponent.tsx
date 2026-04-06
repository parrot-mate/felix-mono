import { AudioPlayState, AudioPlayers, audioPlayerAtom, usePlayAudio } from "@pmate/sdk"
import { Box, IconButton, Slider } from "@mui/material"
import {
  Pause,
  PlayArrow,
  PlayArrowRounded,
  PlayArrowTwoTone,
  StopCircle,
  VolumeUp,
} from "@mui/icons-material"
import { makeStyles } from "tss-react/mui"
import { useAtomValue } from "jotai"

const useStyles = makeStyles()((theme) => {
  return {
    round: {
      borderRadius: "50%",
      background: "#666",
      "& svg": {
        fill: "white",
      },
      "&:hover": {
        background: theme.palette.felling.success,
      },
    },
  }
})

export const PlayerComponent = ({ onPlay }: { onPlay: () => void }) => {
  const player = useAtomValue(audioPlayerAtom(AudioPlayers.BookPlayer))
  const { playState, pause, stop, resume } = usePlayAudio(player)
  const { classes } = useStyles()
  return (
    <Box
      sx={{
        position: "relative",
      }}
    >
      <IconButton
        className={classes.round}
        onClick={() => {
          if (playState === AudioPlayState.Playing) {
            pause()
          } else if (playState === AudioPlayState.Paused) {
            resume()
          } else if (playState === AudioPlayState.Stopped) {
            onPlay()
          }
        }}
      >
        {playState === AudioPlayState.Playing && <Pause />}
        {playState !== AudioPlayState.Playing && <PlayArrow />}
      </IconButton>
      {/* {playState === AudioPlayState.Playing && (
        <IconButton
          onClick={() => {
            pause()
          }}
        >
          <Pause />
        </IconButton>
      )} */}
      {/* {playState === AudioPlayState.Playing && (
        <IconButton
          onClick={() => {
            stop()
          }}
        >
          <StopCircle />
        </IconButton>
      )} */}
      {/* {playState === AudioPlayState.Paused && (
        <IconButton
          onClick={() => {
            resume()
          }}
        >
          <PlayArrowRounded />
        </IconButton>
      )} */}
    </Box>
  )
}
