import { FC } from "react"
import { FlexRow, ImageBox } from "./flex"
import { Button, Paper } from "@mui/material"
import { Em, Line, Sub } from "./typography"
import { FlexLastSpread } from "./flex/FlexLastSpread"
import { PageMode } from "@pmate/meta"

interface Props {
  cover: string
  title: string
  pageNo: number
  onStart?: (mode: PageMode) => void
}
export const LatestReadingCard: FC<Props> = ({ cover, title, onStart }) => {
  return (
    <Paper
      sx={{
        maxWidth: "960px",
        padding: "30px 20px",
      }}
    >
      <FlexRow>
        <ImageBox src={cover} width={"96px"} ratio="3/4" />
        <FlexLastSpread sx={{ flex: 1, ml: "15px" }} direction="column">
          <Line align="left">
            <Em>您正在读</Em>
          </Line>
          <Line>
            <Sub level={2}>{title}</Sub>
          </Line>
          <Line spacing={0}>
            {/* <Button
              onClick={() => {
                onStart && onStart("punch")
              }}
              sx={{
                margin: 0,
              }}
              size={"small"}
            >
              去打卡: 挑战{pageNo + 1}
            </Button> */}
            <Button
              onClick={() => {
                onStart && onStart("tear")
              }}
              size={"small"}
            >
              阅读
            </Button>
          </Line>
        </FlexLastSpread>
      </FlexRow>
    </Paper>
  )
}
