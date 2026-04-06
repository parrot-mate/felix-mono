import type { Prompt, PromptVariable } from "@pmate/meta"
import { Langs, PromptFieldType, PromptTaskType } from "@pmate/meta"
import {
  Card,
  Divider,
  Input,
  InputNumber,
  Select,
  Tag,
  Typography,
} from "antd"
import { useMemo } from "react"
import type {
  RunPromptAccuracy,
  RunPromptExecutionMode,
} from "@/atom/runPromptExecutionAtom"

type RunPromptFormProps = {
  prompt: Prompt
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  accuracy: RunPromptAccuracy
  executionMode: RunPromptExecutionMode
  onAccuracyChange: (value: RunPromptAccuracy) => void
  onExecutionModeChange: (value: RunPromptExecutionMode) => void
}

const getInputProps = (variable: PromptVariable) => {
  if (variable.type === PromptFieldType.Number) {
    return { placeholder: "Enter numeric value" }
  }

  if (variable.type === PromptFieldType.MultiSelect) {
    return { placeholder: "Comma or newline separated values" }
  }

  if (variable.type === PromptFieldType.Text) {
    return { placeholder: "Enter text value" }
  }

  if (variable.type === PromptFieldType.Date) {
    return { type: "date" as const, placeholder: "YYYY-MM-DD or ISO date" }
  }

  return { placeholder: "Enter value" }
}

const accuracyOptions = [
  { label: "low", value: "low" },
  { label: "medium", value: "medium" },
  { label: "high", value: "high" },
]

const executionModeOptions = [
  { label: "false", value: "off" },
  { label: "realtime", value: "realtime" },
  { label: "streaming", value: "streaming" },
  { label: "agent loop", value: "agent-loop" },
]

const taskTypeLabelMap: Record<PromptTaskType, string> = {
  [PromptTaskType.TextToText]: "LLM",
  [PromptTaskType.SpeechToText]: "语音转文本",
  [PromptTaskType.TextToSpeech]: "文本转语音",
  [PromptTaskType.Translation]: "翻译",
  [PromptTaskType.ImageGeneration]: "生成图片",
}

const replaceTemplateValue = (
  content: string,
  variables: Record<string, string>
) => {
  const handle = (match: string, rawKey: string) => {
    const key = rawKey.trim()
    const value = variables[key]
    if (value === undefined || value === null || value === "") {
      return match
    }
    return String(value)
  }

  const mustacheRegex = /{{\\s*(.*?)\\s*}}/g
  const singleBraceRegex = /{\\s*(.*?)\\s*}/g

  const afterMustache = content.replace(mustacheRegex, handle)
  return afterMustache.replace(singleBraceRegex, handle)
}

const estimateTokens = (text: string) => {
  const cjkMatches = text.match(/[\\u4E00-\\u9FFF]/g) ?? []
  const cjkCount = cjkMatches.length
  const nonCjkText = text.replace(/[\\u4E00-\\u9FFF]/g, "")
  const nonCjkChars = nonCjkText.replace(/\\s/g, "").length
  return cjkCount + Math.ceil(nonCjkChars / 4)
}

export const RunPromptForm = ({
  prompt,
  values,
  onChange,
  accuracy,
  executionMode,
  onAccuracyChange,
  onExecutionModeChange,
}: RunPromptFormProps) => {
  const hasVariables = prompt.variables.length > 0
  const tokenEstimate = useMemo(() => {
    const messageText = prompt.messages
      .map((message) => replaceTemplateValue(message.content, values))
      .join("\\n")
    return estimateTokens(messageText)
  }, [prompt.messages, values])

  return (
    <Card
      className="agent-panel"
      bodyStyle={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div className="space-y-2">
        <Typography.Title level={3} className="!mb-0">
          {prompt.title || "Unnamed Prompt"}
        </Typography.Title>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Tag color="geekblue">{prompt.model || "model"}</Tag>
          {prompt.taskType ? (
            <Tag color="purple">
              {taskTypeLabelMap[prompt.taskType] ?? prompt.taskType}
            </Tag>
          ) : null}
          <Tag color="processing">{prompt.resultType?.toUpperCase()}</Tag>
          <span className="font-mono text-xs text-[var(--ui-text-muted)]">
            {prompt.key}
          </span>
        </div>
      </div>

      <Divider className="my-0" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ui-text-muted)]">
            Accuracy
          </span>
          <Select
            value={accuracy}
            onChange={(nextValue) => onAccuracyChange(nextValue as RunPromptAccuracy)}
            options={accuracyOptions}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ui-text-muted)]">
            Execution Mode
          </span>
          <Select
            value={executionMode}
            onChange={(nextValue) =>
              onExecutionModeChange(nextValue as RunPromptExecutionMode)
            }
            options={executionModeOptions}
          />
        </label>
      </div>

      <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-3 text-xs text-[var(--ui-text-muted)]">
        Estimated tokens for this run:{" "}
        <span className="font-semibold text-[var(--ui-text)]">
          {tokenEstimate}
        </span>
      </div>

      <div className="space-y-4">
        {hasVariables ? (
          prompt.variables.map((variable) => {
            const value =
              values[variable.name] ??
              (variable.type === PromptFieldType.Language ? "en" : "")
            const inputProps = getInputProps(variable)
            return (
              <label
                key={variable.name}
                className="flex flex-col gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[var(--ui-text)]">
                      {variable.name}
                    </span>
                    {variable.description ? (
                      <span className="text-xs text-[var(--ui-text-muted)]">
                        {variable.description}
                      </span>
                    ) : null}
                  </div>
                  <Tag color="default">{variable.type}</Tag>
                </div>
                {variable.type === PromptFieldType.Language ? (
                  <Select
                    showSearch
                    value={value}
                    style={{ width: "100%" }}
                    optionFilterProp="label"
                    onChange={(nextValue) => onChange(variable.name, nextValue)}
                    options={Langs.map((lang) => ({
                      value: lang.short,
                      label: lang.full,
                    }))}
                  />
                ) : variable.type === PromptFieldType.Number ? (
                  <InputNumber
                    style={{ width: "100%" }}
                    value={value === "" ? undefined : Number(value)}
                    placeholder={inputProps.placeholder}
                    onChange={(nextValue) =>
                      onChange(
                        variable.name,
                        nextValue === null ? "" : String(nextValue)
                      )
                    }
                  />
                ) : variable.type === PromptFieldType.MultiSelect ||
                  variable.type === PromptFieldType.Text ? (
                  <Input.TextArea
                    value={value}
                    className="min-h-[7rem]"
                    placeholder={inputProps.placeholder}
                    autoSize={{ minRows: 3 }}
                    onChange={(event) =>
                      onChange(variable.name, event.target.value)
                    }
                  />
                ) : (
                  <Input
                    value={value}
                    type={inputProps.type ?? "text"}
                    placeholder={inputProps.placeholder}
                    onChange={(event) =>
                      onChange(variable.name, event.target.value)
                    }
                  />
                )}
              </label>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-2)] p-4 text-sm text-[var(--ui-text-muted)]">
            This prompt does not require any variables.
          </div>
        )}
      </div>
    </Card>
  )
}
