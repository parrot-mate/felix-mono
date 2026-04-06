import { Box, styled, BoxProps } from "@mui/material"

export const FlexCenter = styled(Box)(({ alignItems, justifyContent }) => {
  return {
    display: "flex",
    justifyContent: (justifyContent as string) || "center",
    alignItems: (alignItems as string) || "center",
  }
})
