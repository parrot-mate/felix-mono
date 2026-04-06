import { Box, styled } from "@mui/material"

export const FlexRow = styled(Box)(({ justifyContent }) => {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: (justifyContent as "string") || "center",
  }
})
