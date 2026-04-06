import type { IconProps } from "../types/base"

export const IconPlayer = (props: IconProps) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M16 2L26 6V13C26 21 21 27 16 30C11 27 6 21 6 13V6L16 2Z" fill="url(#paint0_linear_272_225)"/>
    <path d="M16 8L18 13H23L19 16L21 21L16 18L11 21L13 16L9 13H14L16 8Z" fill="white"/>
    <defs>
      <linearGradient id="paint0_linear_272_225" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9C6BFF"/>
        <stop offset="1" stop-color="#5E4099"/>
      </linearGradient>
    </defs>
  </svg>
)
