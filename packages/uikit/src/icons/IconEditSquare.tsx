import type { IconProps } from "../types/base"

export const IconEditSquare = ({ className, ...rest }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...rest}
  >
    <path
      d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25z"
      fill="currentColor"
    />
    <path
      d="M19.71 5.04l-2.34-2.34a1 1 0 0 0-1.42 0L14.11 4.54l3.75 3.75 1.83-1.83a1 1 0 0 0 0-1.42Z"
      fill="currentColor"
    />
  </svg>
)
