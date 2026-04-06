import React, { FC, ReactElement } from "react"

interface IconBoxProps {
  children: React.ReactNode
  use?: "pretext" | "normal"
  type?: "success" | "unfinished" | "info" | "reverse"
  size?: "small" | "medium" | "large"
}

const typeClasses = {
  success: "text-[#4CAF50]",
  info: "text-[#96c0ba]",
  unfinished: "text-[#999999]",
  reverse: "text-white",
}

const sizeClasses = {
  small: "w-4 h-4",
  medium: "w-6 h-6",
  large: "w-8 h-8",
}

const useClasses = {
  pretext: "mr-1",
  normal: "",
}

export const IconBox: FC<IconBoxProps> = ({
  children,
  use = "normal",
  type = "unfinished",
  size = "small",
}) => {
  const child = React.isValidElement(children)
    ? React.cloneElement(children as ReactElement, {
        className: `${sizeClasses[size]} ${
          (children as ReactElement).props.className || ""
        }`,
      })
    : children

  return (
    <div
      className={`flex items-center justify-center ${typeClasses[type]} ${useClasses[use]}`}
    >
      {child}
    </div>
  )
}
