import { useState } from "react";
import { atom, useAtom } from "jotai";

const openAtom = atom(true);
export const useOpen = () => {
  const [open, setOpen] = useAtom(openAtom);

  const toggle = () => {
    setOpen((prev) => !prev);
  };

  return [open, toggle] as const;
};
