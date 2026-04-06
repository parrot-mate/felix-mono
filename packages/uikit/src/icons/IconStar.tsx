import type { IconProps } from "../types/base"

export const IconStar = ({ className, fill = "currentColor", style, onClick }: IconProps) => (
  <svg
    className={className}
    fill={fill}
    style={style}
    onClick={onClick}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)

