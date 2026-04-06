import { Box, keyframes } from "@mui/material"
import React from "react"
import { makeStyles } from "tss-react/mui"

const wave = keyframes`
  0%, 100% {
    height: 10%;
  }
  50% {
    height: 30%;
  }
`

const useStyles = makeStyles()({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    width: "100px",
    height: "60px",
    background: "#c0efce",
    border: ".5px solid #f2f3f3",
    borderRadius: "15px",
    overflow: "hidden",
  },
  bar: {
    width: "2px",
    backgroundColor: "black",
    borderRadius: "3px",
    animation: `${wave} .5s infinite ease-in-out`,
  },
})

export const WaveformAnimation: React.FC = () => {
  const { classes } = useStyles()

  const delays = [0, 0.2, 0.4, 0.6]

  return (
    <Box className={classes.container}>
      {delays.map((delay, index) => (
        <Box
          key={index}
          className={classes.bar}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </Box>
  )
}
