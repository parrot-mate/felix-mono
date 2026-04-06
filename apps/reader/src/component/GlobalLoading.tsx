import { Backdrop, CircularProgress } from "@mui/material"
export const GlobalLoading = () => {
  return (
    <Backdrop
      className="text-white z-[999999] bg-white"
      open={true}
    >
      <CircularProgress color="info" />
    </Backdrop>
  )
}
