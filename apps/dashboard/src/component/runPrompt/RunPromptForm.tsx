import type { Prompt, PromptVariable } from "@pmate/meta"
import { Langs, PromptFieldType } from "@pmate/meta"
import { Input, InputNumber, Select } from "antd"

type RunPromptFormProps = {
  prompt: Prompt
  values: Record<string, string>
  onChange: (name: string, value: string) => void
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

export const RunPromptForm = ({ prompt, values, onChange }: RunPromptFormProps) => {
  const hasVariables = prompt.variables.length > 0

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg shadow-slate-900/40">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-100">{prompt.title || "Unnamed Prompt"}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded bg-slate-800 px-2 py-1 font-mono text-xs uppercase tracking-wider text-primary-300">
            {prompt.model || "model"}
          </span>
          <span className="text-slate-400">{prompt.key}</span>
          <span className="text-slate-500">{prompt.resultType?.toUpperCase()}</span>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {hasVariables ? (
          prompt.variables.map((variable) => {
            const value =
              values[variable.name] ??
              (variable.type === PromptFieldType.Language ? "en" : "")
            const inputProps = getInputProps(variable)
            return (
              <label
                key={variable.name}
                className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-100">
                      {variable.name}
                    </span>
                    {variable.description ? (
                      <span className="text-xs text-slate-400">{variable.description}</span>
                    ) : null}
                  </div>
                  <span className="rounded border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-400">
                    {variable.type}
                  </span>
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
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">
            This prompt does not require any variables.
          </div>
        )}
      </div>
    </div>
  )
}
