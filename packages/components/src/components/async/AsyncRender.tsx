import { Maybe, isMaybe } from "@pmate/utils"
import { ReactNode, useEffect, useState } from "react"

export const AsyncRender = ({
  children,
}: {
  children: Promise<React.ReactNode> | Promise<Maybe<ReactNode>>
}) => {
  const [node, setNode] = useState<ReactNode>(null)

  const load = async () => {
    let node = await children
    if (isMaybe(node)) {
      node = node.unwrapOr(null)
    }
    setNode(node)
  }
  useEffect(() => {
    load()
  }, [])

  return node
}
