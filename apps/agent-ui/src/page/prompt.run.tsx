import { promptDetailAtom } from "@/atom/remotePromptsAtom"
import { runPromptExecutionAtom } from "@/atom/runPromptExecutionAtom"
import { RunPromptActionPanel } from "@/component/runPrompt/RunPromptActionPanel"
import { RunPromptForm } from "@/component/runPrompt/RunPromptForm"
import { RunPromptLogPanel } from "@/component/runPrompt/RunPromptLogPanel"
import { Breadcrumb, Card, Typography } from "antd"
import { useAtom, useAtomValue } from "jotai"
import { Suspense, useCallback, useEffect, useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"

const encodePromptKey = (key: string) =>
  key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

const RunPromptPageContent = ({ promptKey }: { promptKey: string }) => {
  const detailAtom = useMemo(() => promptDetailAtom(promptKey), [promptKey])
  const prompt = useAtomValue(detailAtom)
  const executionAtom = useMemo(
    () => runPromptExecutionAtom(promptKey),
    [promptKey]
  )
  const [state, dispatch] = useAtom(executionAtom)

  useEffect(() => {
    dispatch({ type: "syncPrompt", prompt })
  }, [dispatch, prompt])

  const handleVariableChange = useCallback(
    (name: string, value: string) => {
      dispatch({ type: "updateVariable", name, value })
    },
    [dispatch]
  )

  const handleAccuracyChange = useCallback(
    (value: "low" | "medium" | "high") => {
      dispatch({ type: "updateExecutionOptions", accuracy: value })
    },
    [dispatch]
  )

  const handleExecutionModeChange = useCallback(
    (value: "off" | "realtime" | "streaming" | "agent-loop") => {
      dispatch({ type: "updateExecutionOptions", executionMode: value })
    },
    [dispatch]
  )

  const handleRun = useCallback(() => {
    dispatch({ type: "run", prompt })
  }, [dispatch, prompt])

  const isReady = useMemo(() => {
    return prompt.variables.every((variable) => {
      const isRequired = variable.required ?? true
      if (!isRequired) {
        return true
      }

      const value = state.variables[variable.name]
      if (value === undefined || value === null) {
        return false
      }

      if (typeof value === "string") {
        return value.trim().length > 0
      }

      return true
    })
  }, [prompt.variables, state.variables])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <RunPromptForm
          prompt={prompt}
          values={state.variables}
          onChange={handleVariableChange}
          accuracy={state.accuracy}
          executionMode={state.executionMode}
          onAccuracyChange={handleAccuracyChange}
          onExecutionModeChange={handleExecutionModeChange}
        />
        <Card className="agent-panel">
          <div className="flex justify-end">
            <RunPromptActionPanel
              status={state.status}
              isReady={isReady}
              onRun={handleRun}
            />
          </div>
        </Card>
      </div>
      <RunPromptLogPanel promptKey={promptKey} />
    </div>
  )
}

export const RunPromptPage = () => {
  const [searchParams] = useSearchParams()
  const keyParam = searchParams.get("key")

  if (!keyParam) {
    return null
  }

  let promptKey: string
  try {
    promptKey = decodeURIComponent(keyParam)
  } catch {
    return null
  }

  return (
    <Suspense
      fallback={
        <Card className="agent-panel">
          <Typography.Text>Loading prompt...</Typography.Text>
        </Card>
      }
    >
      <div className="space-y-6">
        <Breadcrumb
          items={[
            {
              title: (
                <Link to={`/prompts?key=${encodePromptKey(promptKey)}`}>
                  Prompts
                </Link>
              ),
            },
            {
              title: (
                <span className="font-medium text-[var(--ui-text)]">
                  {promptKey}
                </span>
              ),
            },
          ]}
        />
        <div className="agent-banner">
          <Typography.Title level={2} className="!mb-1">
            Execute Prompt
          </Typography.Title>
          <Typography.Text className="text-[var(--ui-text-muted)]">
            Provide variables and run the prompt workflow.
          </Typography.Text>
        </div>
        <RunPromptPageContent promptKey={promptKey} />
      </div>
    </Suspense>
  )
}

export default RunPromptPage
