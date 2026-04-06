import {
  runPromptLogAtom,
  type RunPromptLogEntry,
} from "@/atom/runPromptLogAtom"
import { Card, Empty, Typography } from "antd"
import { useAtomValue } from "jotai"

type RunPromptLogPanelProps = {
  promptKey: string
}

export const RunPromptLogPanel = ({ promptKey }: RunPromptLogPanelProps) => {
  const logs = useAtomValue(runPromptLogAtom(promptKey))

  return (
    <Card
      className="agent-panel"
      title="Execution Logs"
      bodyStyle={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div className="flex-1 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-4">
        <div className="space-y-2 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Typography.Text className="text-[var(--ui-text-muted)]">
                  Awaiting execution logs.
                </Typography.Text>
              }
            />
          ) : (
            logs.map((entry, index) => (
              <LogEntry key={`${entry.type}-${index}`} entry={entry} />
            ))
          )}
        </div>
      </div>
    </Card>
  )
}

const LogEntry = ({ entry }: { entry: RunPromptLogEntry }) => {
  if (entry.type === "line") {
    return <div className="break-words text-[var(--ui-text)]">{entry.text}</div>
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ui-text-muted)]">
        {entry.title}
      </div>
      <div className="space-y-1">
        {entry.lines.map((line, lineIndex) => (
          <div
            key={`${entry.title}-${lineIndex}-${line}`}
            className="whitespace-pre-wrap break-words font-medium text-[var(--ui-text)]"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}
