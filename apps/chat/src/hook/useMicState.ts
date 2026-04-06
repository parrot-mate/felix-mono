import { micStateAtom } from "@/atom/micStateAtom"
import { useAtomValue } from "jotai"
import { useMicContext } from "./useMicContext"

export const useMicState = () => {
  const { id } = useMicContext()
  return useAtomValue(micStateAtom(id))
}
