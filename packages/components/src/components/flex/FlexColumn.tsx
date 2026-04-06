import { Box, styled } from "@mui/material"

export const FlexColumn = styled(Box)(({ justifyContent }) => {
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: (justifyContent as "string") || "center",
  }
})
