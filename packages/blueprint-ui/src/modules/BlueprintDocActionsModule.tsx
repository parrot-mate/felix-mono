import React from "react"
import { BlueprintButton } from "../components/BlueprintButton"
import { BlueprintPanel } from "../components/BlueprintPanel"

export type BlueprintDocActionsModuleProps = {
  title: string
  actions: Array<{
    key: string
    label: string
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
  }>
  activeFile?: string
  files: Array<{
    key: string
    label: string
    disabled?: boolean
    onClick?: () => void
  }>
  helperText?: string
}

export function BlueprintDocActionsModule({
  title,
  actions,
  activeFile,
  files,
  helperText,
}: BlueprintDocActionsModuleProps) {
  return (
    <BlueprintPanel title={title}>
      <div className="bp-actions">
        {actions.map((item) => (
          <BlueprintButton
            key={item.key}
            disabled={item.disabled}
            onClick={item.onClick}
            ariaLabel={item.label}
          >
            {item.loading ? `${item.label} 中...` : item.label}
          </BlueprintButton>
        ))}
      </div>
      <div style={{ height: 16 }} />
      <div className="bp-doc-tabs">
        {files.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={item.onClick}
            className={item.key === activeFile ? "bp-doc-tab bp-doc-tab--active" : "bp-doc-tab"}
          >
            {item.label}
          </button>
        ))}
      </div>
      {helperText ? <p className="bp-panel__meta" style={{ marginTop: 12 }}>{helperText}</p> : null}
    </BlueprintPanel>
  )
}
