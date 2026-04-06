import {
  runPromptLogAtom,
  type RunPromptLogEntry,
} from "@/atom/runPromptLogAtom"
import { useAtomValue } from "jotai"

type RunPromptLogPanelProps = {
  promptKey: string
}

export const RunPromptLogPanel = ({ promptKey }: RunPromptLogPanelProps) => {
  const logs = useAtomValue(runPromptLogAtom(promptKey))

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg shadow-slate-900/40">
      <h2 className="text-lg font-semibold text-slate-100">Execution Logs</h2>
      <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950 p-4">
        <div className="space-y-2 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-slate-500">Awaiting execution logs.</div>
          ) : (
            logs.map((entry, index) => (
              <LogEntry key={`${entry.type}-${index}`} entry={entry} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const LogEntry = ({ entry }: { entry: RunPromptLogEntry }) => {
  if (entry.type === "line") {
    return (
      <div className="break-words text-slate-300">
        {entry.text}
      </div>
    )
  }

  return (
    <div className="space-y-1 rounded-md border border-slate-800 bg-slate-900/70 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
        {entry.title}
      </div>
      <div className="space-y-1">
        {entry.lines.map((line, lineIndex) => (
          <div
            key={`${entry.title}-${lineIndex}-${line}`}
            className="whitespace-pre-wrap break-words font-medium text-slate-100"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}
