import React from "react"

export type BlueprintPanelProps = {
  title?: string
  description?: string
  eyebrow?: string
  children: React.ReactNode
  className?: string
}

export function BlueprintPanel({
  title,
  description,
  eyebrow,
  children,
  className,
}: BlueprintPanelProps) {
  return (
    <section className={className ? `bp-panel ${className}` : "bp-panel"}>
      <div className="bp-panel__body">
        {eyebrow ? <p className="bp-eyebrow">{eyebrow}</p> : null}
        {title ? <h3 className="bp-panel__title">{title}</h3> : null}
        {description ? <p className="bp-panel__meta">{description}</p> : null}
        {title || description || eyebrow ? <div style={{ height: 16 }} /> : null}
        {children}
      </div>
    </section>
  )
}
