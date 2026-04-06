import { Paper, styled } from "@mui/material"
import medal from "../assets/medal.webp"
import { MetricDisplay } from "./MetricDisplay"
import { makeStyles } from "tss-react/mui"
import { StyleProps } from "../component.types"
import { FlexCenter, FlexColumn, FlexRow } from "./flex"
import { CoinFlipButton } from "./CoinFlipButton"
import { keyframes } from "@emotion/react"

export interface PunchEggProps extends StyleProps {
  disabled: boolean
  wordCount: number
  active: boolean
  timeInSecond: number
  text: string
  reviewed: number
  newWords: number
  onClick?: () => void
  showButton?: boolean
}

const fire = keyframes`
  0% {
    box-shadow: 0 0 5px #cbff49, 0 0 2px #f2f919, 0 0 1px #f2f919;
  }
  25% {
    box-shadow: 0 0 5px #f2f919, 0 0 2px #dcf554, 0 0 1px #cc0000;
  }
  50% {
    box-shadow: 0 0 5px #dcf554, 0 0 2px #cbff49, 0 0 1px #cc0000;
  }
  75% {
    box-shadow: 0 0 5px #cbff49, 0 0 2px #dcf554, 0 0 1px #f2f919;
  }
  100% {
    box-shadow: 0 0 5px #f2f919, 0 0 2px #cbff49, 0 0 1px #dcf554;
  }
`

const useStyles = makeStyles()((theme) => ({
  image: {
    display: "block",
    width: "80%",
    animation: `${fire} 0.5s infinite alternate`,
    filter: "blur(0.8px)",
  },
  root: {
    borderRadius: "20px",
    overflow: "hidden",
    padding: "10px 20px",
    overflowX: "hidden",
    [theme.breakpoints.down("sm")]: {
      fontSize: "11px",
    },
  },
  imageContainer: {
    marginRight: "10px",
    width: "128px",
    height: "128px",
    overflow: "hidden",
    marginBottom: "10px",
    [theme.breakpoints.down("md")]: {
      width: "64px",
      height: "64px",
    },
    [theme.breakpoints.down("sm")]: {
      width: "32px",
      height: "32px",
    },
  },
}))

export const PunchEgg = styled(
  ({
    wordCount,
    timeInSecond,
    reviewed,
    active,
    disabled,
    text,
    newWords,
    sx,
    className,
    showButton = true,
    onClick,
  }: PunchEggProps) => {
    const { classes } = useStyles()

    const _class = `${className || ""} ${classes.root}`
    const metrics = [
      { label: "总词数", value: wordCount },
      { label: "阅读时间", value: timeInSecond, unit: "time" },
      { label: "复习词汇", value: reviewed },
      { label: "学习新词", value: newWords },
    ]
    return (
      <Paper sx={sx} className={_class}>
        <FlexColumn alignItems={"center"}>
          <FlexCenter className={classes.imageContainer}>
            <img
              className={classes.image}
              style={{
                filter: !active ? "grayscale(100%)" : "none",
              }}
              src={medal}
            />
          </FlexCenter>

          <FlexCenter
            sx={{
              padding: "0px 20px",
            }}
            flexDirection={"column"}
          >
            <FlexRow flexWrap={"wrap"} justifyContent={"space-around"}>
              {metrics.map((metric, i) => (
                <MetricDisplay
                  key={i}
                  label={metric.label}
                  value={metric.value}
                  unit={metric.unit as "time" | undefined}
                  sx={{
                    width: "140px",
                    marginRight: "30px",
                  }}
                />
              ))}
            </FlexRow>

            {showButton && (
              <CoinFlipButton
                disabled={disabled}
                onClick={() => {
                  if (onClick) {
                    onClick()
                  }
                }}
              >
                {text}
              </CoinFlipButton>
            )}
          </FlexCenter>
        </FlexColumn>
      </Paper>
    )
  }
)(() => ({}))
