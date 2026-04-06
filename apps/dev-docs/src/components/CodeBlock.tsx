import React from "react"

type CodeBlockProps = React.HTMLAttributes<HTMLPreElement> & {
  children?: React.ReactNode
}

const extractText = (node: React.ReactNode): string => {
  if (typeof node === "string") return node
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement(node)) {
    return extractText(node.props.children)
  }
  return ""
}

export const CodeBlock = ({ children, className, ...rest }: CodeBlockProps) => {
  const [copied, setCopied] = React.useState(false)
  const timerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = async () => {
    const text = extractText(children)
    if (!text) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = text
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
      setCopied(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // noop
    }
  }

  return (
    <pre className={`code-block ${className ?? ""}`} {...rest}>
      <button
        type="button"
        className="code-copy-button"
        onClick={handleCopy}
        aria-label="Copy code"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="code-copy-icon"
        >
          <path
            fill="currentColor"
            d="M16 1H6a2 2 0 0 0-2 2v10h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z"
          />
        </svg>
        <span className="code-copy-text">{copied ? "Copied" : "Copy"}</span>
      </button>
      {children}
    </pre>
  )
}
