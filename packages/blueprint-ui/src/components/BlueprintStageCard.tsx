import React from "react"
import { BlueprintPanel } from "./BlueprintPanel"
import { BlueprintTag } from "./BlueprintTag"

export type BlueprintStageCardProps = {
  title: string
  description: string
  status: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function BlueprintStageCard({
  title,
  description,
  status,
  active = false,
  disabled = false,
  onClick,
}: BlueprintStageCardProps) {
  const body = (
    <BlueprintPanel title={title} description={description}>
      <div className="bp-stage-card">
        <BlueprintTag>{status}</BlueprintTag>
      </div>
    </BlueprintPanel>
  )

  if (!onClick) {
    return body
  }

  return (
    <button
      type="button"
      className={active ? "bp-stage-button bp-stage-button--active" : "bp-stage-button"}
      disabled={disabled}
      onClick={onClick}
      aria-label={title}
    >
      {body}
    </button>
  )
}
