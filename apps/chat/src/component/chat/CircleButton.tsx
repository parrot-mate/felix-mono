import { forwardRef } from "react"

interface CircleButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
}

export const CircleButton = forwardRef<HTMLDivElement, CircleButtonProps>(
  ({ size = 48, className, style, ...rest }, ref) => (
    <div
      ref={ref}
      role="button"
      style={{
        width: size,
        height: size,
        ...style,
      }}
      className={`
        inline-flex items-center justify-center
        rounded-full border-0 cursor-pointer
        ${className ?? ""}
      `}
      {...rest}
    />
  )
)
