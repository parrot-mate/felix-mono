import type { IconProps } from "../types/base"

export const IconMale = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle
      cx="10"
      cy="14"
      r="4"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M13 11L20 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M14.5 4H20V9.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)
