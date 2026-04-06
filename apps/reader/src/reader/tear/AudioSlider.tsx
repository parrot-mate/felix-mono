import { Box, Slider } from "@mui/material"

export const AudioSlider = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: "-20px",
      }}
    >
      <Slider />
    </Box>
  )
}
