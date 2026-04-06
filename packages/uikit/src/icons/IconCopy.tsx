import type { IconProps } from "../types/base"

export const IconCopy = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="8"
      y="7"
      width="9"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="5"
      y="4"
      width="9"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.5"
    />
  </svg>
)
