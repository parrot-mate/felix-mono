import { explainTabsAtom } from "@/reader/atom/explainTabsAtom"
import { Box } from "@mui/material"
import { useAtomValue } from "jotai"

export const Paging = ({ pid }: { pid: number }) => {
  const data = useAtomValue(explainTabsAtom)
  return (
    <>
      {!data && (
        <Box
          data-paging
          sx={{
            position: "fixed",
            bottom: "20px",
            right: "50%",
            transform: "translateX(50%)",
            color: "white",
            fontWeight: "bold",
            zIndex: 1,
            fontSize: "12px",
            opacity: 0.5,
            textShadow: "0px 0px 2px black, 0px 0px 5px black",
          }}
        >
          {pid}
        </Box>
      )}
    </>
  )
}
