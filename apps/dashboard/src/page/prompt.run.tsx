import { promptDetailAtom } from "@/atom/remotePromptsAtom"
import { runPromptExecutionAtom } from "@/atom/runPromptExecutionAtom"
import { RunPromptActionPanel } from "@/component/runPrompt/RunPromptActionPanel"
import { RunPromptForm } from "@/component/runPrompt/RunPromptForm"
import { RunPromptLogPanel } from "@/component/runPrompt/RunPromptLogPanel"
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <RunPromptForm
          prompt={prompt}
          values={state.variables}
          onChange={handleVariableChange}
        />
        <div className="flex justify-end">
          <RunPromptActionPanel
            status={state.status}
            isReady={isReady}
            onRun={handleRun}
          />
        </div>
      </div>
      <RunPromptLogPanel promptKey={promptKey} />
    </div>
  )
}

export const RunPromptPage = () => {
  const [searchParams] = useSearchParams()
  const keyParam = searchParams.get("key")

  if (!keyParam) {
    // return <Navigate to="/prompts" replace />
    return null
  }

  let promptKey: string
  try {
    promptKey = decodeURIComponent(keyParam)
  } catch {
    // return <Navigate to="/prompts" replace />
    return null
  }

  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-200">
          Loading prompt…
        </div>
      }
    >
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-slate-300">
          <Link
            to={`/prompts?key=${encodePromptKey(promptKey)}`}
            className="font-medium text-primary-300 transition-colors hover:text-primary-200"
          >
            Prompts
          </Link>
          <span className="text-slate-500">/</span>
          <span className="truncate font-medium text-slate-100">
            {promptKey}
          </span>
        </nav>
        <RunPromptPageContent promptKey={promptKey} />
      </div>
    </Suspense>
  )
}

export default RunPromptPage
