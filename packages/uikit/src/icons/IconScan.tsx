import type { IconProps } from "../types/base"

export const IconScan = ({ className, ...rest }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    className={className}
    {...rest}
  >
    <path d="M6 3H4a1 1 0 0 0-1 1v2m16-3h2a1 1 0 0 1 1 1v2M3 18v2a1 1 0 0 0 1 1h2m12 0h2a1 1 0 0 0 1-1v-2" />
    <rect x={6} y={6.5} width={12} height={11} rx={2} />
    <path d="M3 12h18" />
  </svg>
)
