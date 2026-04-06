import type { IconProps } from "../types/base"

export const IconStarOutline = ({
  className,
  fill = "none",
  style,
  onClick,
}: IconProps) => (
  <svg
    className={className}
    fill={fill}
    style={style}
    onClick={onClick}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path d="M12 17.27 6.18 21l1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62L22 9.24l-5.82 4.73L17.82 21z" />
  </svg>
)

