import { atom, useAtom } from "jotai"
import React, { useContext } from "react"

const outAtom = atom(false)
export const useTitlebarScrollOut = () => {
  return useAtom(outAtom)
}
export const useTitlebar = () => {
  const [out] = useAtom(outAtom)
  return {
    scrollOut: out,
  }
}
