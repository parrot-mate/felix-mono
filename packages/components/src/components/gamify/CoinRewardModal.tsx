import { Button, Modal, ModalProps, Paper } from "@mui/material"
import { Coin } from "./Coin"
import { Em, Line } from "../typography"
import { FlexCenter } from "../flex"

export const CoinRewardModal = ({
  num,
  onProceed,
  ...others
}: { num: number; onProceed?: () => void } & Omit<ModalProps, "children">) => {
  return (
    <Modal {...others}>
      <Paper
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: "30px",
        }}
      >
        <Line spacing={2}>
          <Em level={3}>Congratulations!!</Em>
        </Line>
        <Line align="center">
          <Coin num={num} size={"large"} play={true}></Coin>
        </Line>
        <FlexCenter
          sx={{
            marginTop: "1rem",
          }}
        >
          <Button
            size="small"
            onClick={() => {
              onProceed && onProceed()
              others.onClose && others.onClose({}, "backdropClick")
            }}
          >
            确认
          </Button>
        </FlexCenter>
      </Paper>
    </Modal>
  )
}
