import type { IconProps } from "../types/base"

export const IconQrCode = ({ className, ...rest }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    role="img"
    className={className}
    {...rest}
  >
    <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v3h-2v-1h-1v-2zm-4 0h2v2h-2v-2zm-4 0h2v2h-2v-2zm8 4h3v6h-6v-3h2v1h2v-2h-1v-2zm-4 0h2v2h-2v-2zm-4 0h2v2h-2v-2zm0 4h2v3H7v-3h2v1h2v-1z" />
  </svg>
)
