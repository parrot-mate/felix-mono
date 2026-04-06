import { Button } from "@pmate/uikit"
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
    <Button variant="primary" disabled={disabled} onClick={onRun}>
      {status === "running" ? "Running…" : "Run"}
    </Button>
  )
}
