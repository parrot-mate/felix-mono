import { useId } from "react"

type ThemeToggleProps = {
  checked: boolean
  onChange: () => void
}

export const ThemeToggle = ({ checked, onChange }: ThemeToggleProps) => {
  const id = useId()

  return (
    <label htmlFor={id} className="uiverse-toggle">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label="Toggle theme"
      />
      <span className="toggle-body">
        <span className="toggle-knob">
          <span className="toggle-icon toggle-icon--sun">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5-3.5a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0 1 1 0 0 1 1-1ZM6 12a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0 1 1 0 0 1 1-1Zm10.6 5.1a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 1 1-1.4 1.4l-1.1-1.1a1 1 0 0 1 0-1.4Zm-9.2-9.2a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 1 1-1.4 1.4L7.4 9.1a1 1 0 0 1 0-1.4Zm10.6-1.4a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 0 1-1.4-1.4l1.1-1.1a1 1 0 0 1 1.4 0ZM7.4 16.9a1 1 0 0 1 0 1.4l-1.1 1.1A1 1 0 0 1 4.9 18l1.1-1.1a1 1 0 0 1 1.4 0Z" />
            </svg>
          </span>
          <span className="toggle-icon toggle-icon--moon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.1 14.7a7.5 7.5 0 0 1-10.8-9.8 1 1 0 0 0-1.3-1.4 9.5 9.5 0 1 0 13.5 13.5 1 1 0 0 0-1.4-1.3Z" />
            </svg>
          </span>
        </span>
        <span className="toggle-glow" aria-hidden="true" />
      </span>
      <span className="toggle-text">{checked ? "Dark" : "Light"}</span>
    </label>
  )
}
