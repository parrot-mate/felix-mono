import React from "react"

export type BlueprintTagProps = {
  children: React.ReactNode
}

export function BlueprintTag({ children }: BlueprintTagProps) {
  return <span className="bp-tag">{children}</span>
}
