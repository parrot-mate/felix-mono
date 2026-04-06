import { Button } from "antd"
import type { RunPromptExecutionStatus } from "@/atom/runPromptExecutionAtom"

type RunPromptActionPanelProps = {
  status: RunPromptExecutionStatus
  isReady: boolean
  onRun: () => void
}

export const RunPromptActionPanel = ({
  status,
  isReady,
  onRun,
}: RunPromptActionPanelProps) => {
  const disabled = !isReady || status === "running"

  return (
    <Button type="primary" disabled={disabled} loading={status === "running"} onClick={onRun}>
      {status === "running" ? "Running…" : "Run"}
    </Button>
  )
}
