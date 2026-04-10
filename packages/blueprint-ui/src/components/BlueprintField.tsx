import React from "react"

export type BlueprintFieldProps = {
  id?: string
  name?: string
  label: string
  hint?: string
  placeholder?: string
  kind?: "text" | "textarea" | "select"
  multiline?: boolean
  required?: boolean
  readOnly?: boolean
  options?: Array<{ value: string; label: string }>
  value?: string
  onChange?: (value: string) => void
}

export function BlueprintField({
  id,
  name,
  label,
  hint,
  placeholder,
  kind = "text",
  multiline,
  required,
  readOnly = false,
  options = [],
  value = "",
  onChange,
}: BlueprintFieldProps) {
  const resolvedKind = kind === "textarea" || multiline ? "textarea" : kind
  const fieldId = id ?? name ?? `bp-field-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <label className="bp-field" htmlFor={fieldId}>
      <span className="bp-field__label">
        {label}
        {required ? <span className="bp-field__required">*</span> : null}
      </span>
      {resolvedKind === "textarea" ? (
        <textarea
          id={fieldId}
          name={name}
          aria-label={label}
          readOnly={readOnly}
          className="bp-field__control bp-field__control--textarea"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : resolvedKind === "select" ? (
        <select
          id={fieldId}
          name={name}
          aria-label={label}
          disabled={readOnly}
          className="bp-field__control"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          name={name}
          aria-label={label}
          readOnly={readOnly}
          className="bp-field__control"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
      {hint ? <span className="bp-field__hint">{hint}</span> : null}
    </label>
  )
}
