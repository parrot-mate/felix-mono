import type { ReactNode } from "react"
import { pipelineWorkerAtom } from "@sdk/atom/pipelineWorkerAtom"
import { useAtomValue } from "jotai"

export const PipelineProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  useAtomValue(pipelineWorkerAtom)
  return <>{children}</>
}