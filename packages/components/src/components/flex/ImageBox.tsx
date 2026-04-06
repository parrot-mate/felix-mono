import { Box, BoxProps } from "@mui/material"
import { FC } from "react"
import { makeStyles } from "tss-react/mui"

interface ImageBoxProps extends BoxProps {
  src: string
  ratio: string
  alt?: string
}
const useStyles = makeStyles()(() => {
  return {
    root: {
      "& img": {
        width: "100%",
        height: "auto",
      },
    },
  }
})
export const ImageBox: FC<ImageBoxProps> = ({ src, alt, ratio, ...others }) => {
  const { classes } = useStyles()
  return (
    <Box className={classes.root} display={"flex"} {...others}>
      <img
        src={src}
        alt={alt || ""}
        style={{
          aspectRatio: ratio || "auto",
        }}
      />
    </Box>
  )
}
