import { Backdrop, CircularProgress } from "@mui/material"
export const GlobalLoading = () => {
  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: 999999, background: "white" }}
      open={true}
    >
      <CircularProgress color="info" />
    </Backdrop>
  )
}
