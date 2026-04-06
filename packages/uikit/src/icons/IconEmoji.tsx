import type { IconProps } from "../types/base"

export const IconEmoji = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="9" cy="10" r="1.1" fill="currentColor" />
    <circle cx="15" cy="10" r="1.1" fill="currentColor" />
    <path
      d="M8.5 14C9 15.5 10.4 16.5 12 16.5C13.6 16.5 15 15.5 15.5 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
